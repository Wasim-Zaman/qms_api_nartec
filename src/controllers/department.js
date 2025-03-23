import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../schemas/department.schema.js";
import MyError from "../utils/error.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class DepartmentController {
  static async getNextDepartmentId() {
    const lastDepartment = await prisma.tblDepartment.findFirst({
      orderBy: {
        tblDepartmentID: "desc",
      },
    });
    return lastDepartment ? lastDepartment.tblDepartmentID + 1 : 1;
  }

  async createDepartment(req, res, next) {
    try {
      const { error, value } = createDepartmentSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const existingDepartment = await prisma.tblDepartment.findFirst({
        where: { deptcode: value.deptcode },
      });

      if (existingDepartment) {
        throw new MyError("Department with this code already exists", 409);
      }

      const deptId = await DepartmentController.getNextDepartmentId();
      console.log(deptId);

      const department = await prisma.tblDepartment.create({
        data: {
          ...value,
          tblDepartmentID: deptId,
        },
      });

      res
        .status(201)
        .json(
          response(201, true, "Department created successfully", department)
        );
    } catch (error) {
      next(error);
    }
  }

  async getAllDepartments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "deptcode",
        order = "asc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const searchCondition = search
        ? {
            OR: [
              { deptcode: { contains: search } },
              { deptname: { contains: search } },
            ],
          }
        : {};

      const total = await prisma.tblDepartment.count({
        where: searchCondition,
      });

      const departments = await prisma.tblDepartment.findMany({
        where: searchCondition,
        orderBy: {
          [sortBy]: order.toLowerCase(),
        },
        skip,
        take: parseInt(limit),
      });

      res.status(200).json(
        response(200, true, "Departments retrieved successfully", {
          data: departments,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentByCode(req, res, next) {
    try {
      const { deptcode } = req.params;

      const department = await prisma.tblDepartment.findUnique({
        where: { tblDepartmentID: deptcode },
      });

      if (!department) {
        throw new MyError("Department not found", 404);
      }

      res
        .status(200)
        .json(
          response(200, true, "Department retrieved successfully", department)
        );
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const { deptcode } = req.params;
      const { error, value } = updateDepartmentSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const department = await prisma.tblDepartment.update({
        where: { deptcode },
        data: value,
      });

      res
        .status(200)
        .json(
          response(200, true, "Department updated successfully", department)
        );
    } catch (error) {
      if (error.code === "P2025") {
        throw new MyError("Department not found", 404);
      }
      next(error);
    }
  }

  async deleteDepartment(req, res, next) {
    try {
      const { deptcode } = req.params;

      const department = await prisma.tblDepartment.delete({
        where: { deptcode },
      });

      res
        .status(200)
        .json(response(200, true, "Department deleted successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        throw new MyError("Department not found", 404);
      }
      next(error);
    }
  }

  async getAllDepartmentsNoPagination(req, res, next) {
    try {
      const departments = await prisma.tblDepartment.findMany({
        orderBy: {
          deptcode: "asc",
        },
      });

      res
        .status(200)
        .json(
          response(
            200,
            true,
            "All departments retrieved successfully",
            departments
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export default DepartmentController;
