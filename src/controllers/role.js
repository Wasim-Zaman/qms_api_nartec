import MyError from "../utils/error.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class RoleController {
  static async createRole(req, res, next) {
    try {
      const { name, description } = req.body;

      // Check if role already exists
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new MyError("Role already exists", 409);
      }

      const role = await prisma.role.create({
        data: {
          name,
          description,
        },
      });

      res
        .status(201)
        .json(response(201, true, "Role created successfully", role));
    } catch (error) {
      next(error);
    }
  }

  static async getAllRoles(req, res, next) {
    try {
      const roles = await prisma.role.findMany({
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      res
        .status(200)
        .json(response(200, true, "Roles retrieved successfully", roles));
    } catch (error) {
      next(error);
    }
  }

  static async getRoleById(req, res, next) {
    try {
      const { id } = req.params;

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        throw new MyError("Role not found", 404);
      }

      res
        .status(200)
        .json(response(200, true, "Role retrieved successfully", role));
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const role = await prisma.role.update({
        where: { id },
        data: {
          name,
          description,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Role updated successfully", role));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("Role not found", 404));
      } else {
        next(error);
      }
    }
  }

  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.role.delete({
        where: { id },
      });

      res
        .status(200)
        .json(response(200, true, "Role deleted successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("Role not found", 404));
      } else {
        next(error);
      }
    }
  }

  static async assignRoleToUser(req, res, next) {
    try {
      const { userId, roleId } = req.body;

      // Check if user and role exist
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const role = await prisma.role.findUnique({ where: { id: roleId } });

      if (!user) throw new MyError("User not found", 404);
      if (!role) throw new MyError("Role not found", 404);

      // Check if assignment already exists
      const existingAssignment = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      if (existingAssignment) {
        throw new MyError("User already has this role", 409);
      }

      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
        include: {
          user: true,
          role: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Role assigned successfully", userRole));
    } catch (error) {
      next(error);
    }
  }

  static async removeRoleFromUser(req, res, next) {
    try {
      const { userId, roleId } = req.params;

      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });

      res
        .status(200)
        .json(response(200, true, "Role removed from user successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("Role assignment not found", 404));
      } else {
        next(error);
      }
    }
  }
}

export default RoleController;
