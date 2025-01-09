import bcrypt from "bcrypt";
import { userSchema } from "../schemas/user.schema.js";
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

      const { userid, password, name, deptcode } = value;

      // Check if super admin exists in database
      let user = await prisma.tblUsers.findFirst({
        where: { userid },
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
        userId: user.userid,
        name: user.name,
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
            await tx.refreshToken.deleteMany({
              where: { userId: user.userid },
            });

            // Create new refresh token
            await tx.refreshToken.create({
              data: {
                token: refreshToken,
                userId: user.userid,
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
        userId: user.userid,
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
            await tx.refreshToken.deleteMany({
              where: { userId: user.userid },
            });

            // Create new refresh token
            await tx.refreshToken.create({
              data: {
                token: refreshToken,
                userId: user.userid,
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
}

export default UserController;
