import bcrypt from "bcrypt";
import { registerSchema, userSchema } from "../schemas/user.schema.js";
import MyError from "../utils/error.js";
import JWT from "../utils/jwt.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class UserController {
  static async login(req, res, next) {
    try {
      // Validate request body
      const { error, value } = userSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { email, password, name, deptcode } = value;

      // Check if super admin exists in database
      let user = await prisma.User.findFirst({
        where: { email },
      });

      if (!user) {
        throw new MyError("User not found", 404);
      }

      // Check if password is correct
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      console.log(user.password);
      if (!isPasswordCorrect) {
        throw new MyError("Invalid password", 401);
      }

      let tokenPayload;
      let accessToken;
      let refreshToken;

      // Create token payload
      tokenPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        deptcode: user.deptcode,
      };

      // Generate tokens
      accessToken = JWT.generateAccessToken(tokenPayload);
      refreshToken = JWT.generateRefreshToken(tokenPayload);

      // Handle token storage with transaction
      try {
        await prisma.$transaction(
          async (tx) => {
            // Delete existing tokens
            await tx.RefreshToken.deleteMany({
              where: { userId: user.id },
            });

            // Create new refresh token
            await tx.RefreshToken.create({
              data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              },
            });
          },
          {
            timeout: 10000, // 10 second timeout
            isolationLevel: "Serializable", // Highest isolation level
          }
        );
      } catch (tokenError) {
        console.error("Token operation failed:", tokenError);
        // If token operations fail, generate new tokens
        accessToken = JWT.generateAccessToken(tokenPayload);
        refreshToken = JWT.generateRefreshToken(tokenPayload);
      }

      // Remove sensitive data before sending response
      const { password: _, ...userData } = user;

      res.status(200).json(
        response(200, true, "User login successful", {
          user: {
            ...userData,
            accessToken,
            refreshToken,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const user = req.user;

      const tokenPayload = {
        userId: user.id,
        name: user.name,
        deptcode: user.deptcode,
      };

      const accessToken = JWT.generateAccessToken(tokenPayload);
      const refreshToken = JWT.generateRefreshToken(tokenPayload);

      // Handle token refresh with transaction
      try {
        await prisma.$transaction(
          async (tx) => {
            // Delete existing tokens
            await tx.RefreshToken.deleteMany({
              where: { userId: user.id },
            });

            // Create new refresh token
            await tx.RefreshToken.create({
              data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          },
          {
            timeout: 10000,
            isolationLevel: "Serializable",
          }
        );

        res.status(200).json(
          response(200, true, "Tokens refreshed successfully", {
            accessToken,
            refreshToken,
          })
        );
      } catch (tokenError) {
        console.error("Token refresh failed:", tokenError);
        throw new MyError("Failed to refresh tokens", 500);
      }
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { email, password, name, deptcode } = value;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new MyError("Email already registered", 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          deptcode,
        },
      });

      // Remove password from response
      const { password: _, ...userData } = user;

      res
        .status(201)
        .json(response(201, true, "User registered successfully", userData));
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req, res, next) {
    try {
      const { email, password, name, deptcode } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new MyError("User with this email already exists", 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          deptcode,
        },
        select: {
          id: true,
          email: true,
          name: true,
          deptcode: true,
          createdAt: true,
          roles: true,
        },
      });

      res
        .status(201)
        .json(response(201, true, "User created successfully", user));
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        order = "desc",
      } = req.query;

      const skip = (page - 1) * limit;

      // Build search conditions
      const searchCondition = search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { deptcode: { contains: search } },
            ],
          }
        : {};

      // Get total count
      const total = await prisma.user.count({
        where: searchCondition,
      });

      // Get users with pagination
      const users = await prisma.user.findMany({
        where: searchCondition,
        select: {
          id: true,
          email: true,
          name: true,
          deptcode: true,
          createdAt: true,
          roles: true,
          _count: {
            select: {
              patients: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          [sortBy]: order,
        },
      });

      const totalPages = Math.ceil(total / limit);

      res.status(200).json(
        response(200, true, "Users retrieved successfully", {
          users,
          pagination: {
            total,
            page: Number(page),
            totalPages,
            hasMore: page < totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          deptcode: true,
          createdAt: true,
          roles: {
            select: {
              name: true,
            },
          },
          //   patients: {
          //     select: {
          //       id: true,
          //       name: true,
          //       status: true,
          //       createdAt: true,
          //     },
          //     orderBy: {
          //       createdAt: "desc",
          //     },
          //     take: 5,
          //   },
          _count: {
            select: {
              patients: true,
            },
          },
        },
      });

      if (!user) {
        throw new MyError("User not found", 404);
      }

      res
        .status(200)
        .json(response(200, true, "User retrieved successfully", user));
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, name, deptcode, password } = req.body;

      // Check if email is being changed and if it's already taken
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: {
              id,
            },
          },
        });

        if (existingUser) {
          throw new MyError("Email already taken", 409);
        }
      }

      // Prepare update data
      const updateData = {
        email,
        name,
        deptcode,
      };

      // If password is provided, hash it
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Remove undefined values
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          deptcode: true,
          createdAt: true,
          roles: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "User updated successfully", user));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("User not found", 404));
      } else {
        next(error);
      }
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res
        .status(200)
        .json(response(200, true, "User deleted successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("User not found", 404));
      } else {
        next(error);
      }
    }
  }
}

export default UserController;
