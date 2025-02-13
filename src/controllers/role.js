import {
  assignRoleSchema,
  createRoleSchema,
  removeRoleSchema,
  updateRoleSchema,
} from "../schemas/role.schema.js";
import MyError from "../utils/error.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";
class RoleController {
  static async createRole(req, res, next) {
    try {
      const { error, value } = createRoleSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { name, description, route } = value;

      // Check if role already exists
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new MyError("Role already exists", 409);
      }

      const role = await prisma.role.create({
        data: value,
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
      const { error, value } = updateRoleSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { id } = req.params;

      const role = await prisma.role.update({
        where: { id },
        data: value,
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

  static async assignRolesToUser(req, res, next) {
    try {
      // Validate request using schema
      const { error, value } = assignRoleSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { userId, roleIds } = value;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        throw new MyError("User not found", 404);
      }

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

      const allRolesIds = [...user.roles.map((role) => role.id), ...roleIds];
      const uniqueRolesIds = [...new Set(allRolesIds)];
      // Update user's roles
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            set: uniqueRolesIds.map((id) => ({ id })),
          },
        },
        include: {
          roles: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Roles assigned successfully", updatedUser));
    } catch (error) {
      next(error);
    }
  }

  static async removeRolesFromUser(req, res, next) {
    try {
      // Validate request using the same schema
      const { error, value } = assignRoleSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { userId, roleIds } = value;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        throw new MyError("User not found", 404);
      }

      // Remove specified roles from user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: roleIds.map((id) => ({ id })),
          },
        },
        include: {
          roles: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Roles removed successfully", updatedUser));
    } catch (error) {
      next(error);
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

  static async removeRoleFromUser(req, res, next) {
    try {
      // Validate request using the removeRoleSchema
      const { error, value } = removeRoleSchema.validate(req.params);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { userId, roleId } = value;

      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new MyError("Role not found", 404);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        throw new MyError("User not found", 404);
      }

      // Check if user has this role
      const hasRole = user.roles.some((role) => role.id === roleId);
      if (!hasRole) {
        throw new MyError("User does not have this role", 400);
      }

      // Remove role from user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: { id: roleId },
          },
        },
        include: {
          roles: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Role removed successfully", updatedUser));
    } catch (error) {
      next(error);
    }
  }
}

export default RoleController;
