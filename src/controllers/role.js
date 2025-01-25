import { assignRoleSchema } from "../schemas/role.schema.js";
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
      const roles = await prisma.role.findMany();

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
      const { error, value } = assignRoleSchema.validate(req.body);
      if (error) {
        throw new MyError(error.message, 400);
      }

      const { userId, roleIds } = value;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: true,
        },
      });

      if (!user) throw new MyError("User not found", 404);

      // Check if all roles exist
      const roles = await prisma.role.findMany({
        where: {
          id: {
            in: roleIds,
          },
        },
      });

      if (roles.length !== roleIds.length) {
        throw new MyError("One or more roles not found", 404);
      }

      // Check for existing role assignments
      const existingRoleIds = user.roles.map((role) => role.id);
      const newRoleIds = roleIds.filter((id) => !existingRoleIds.includes(id));

      if (newRoleIds.length === 0) {
        throw new MyError("User already has all specified roles", 409);
      }

      // Assign roles to user
      const userRole = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            connect: newRoleIds.map((id) => ({ id })),
          },
        },
        include: {
          roles: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Roles assigned successfully", userRole));
    } catch (error) {
      next(error);
    }
  }

  static async removeRoleFromUser(req, res, next) {
    try {
      const { userId, roleId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new MyError("User not found", 404);

      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) throw new MyError("Role not found", 404);

      await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: [{ id: roleId }],
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

  static async getAllRolesNoPagination(req, res, next) {
    try {
      const roles = await prisma.role.findMany({
        orderBy: {
          name: "asc",
        },
      });

      res
        .status(200)
        .json(response(200, true, "All roles retrieved successfully", roles));
    } catch (error) {
      next(error);
    }
  }
}

export default RoleController;
