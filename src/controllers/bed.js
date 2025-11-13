import { createBedSchema } from "../schemas/bed.schama.js";
import MyError from "../utils/error.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class BedController {
  static async createBed(req, res, next) {
    try {
      const { error, value } = createBedSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { bedNumber, bedStatus } = value;

      // Check if bed number already exists
      const existingBed = await prisma.bed.findFirst({
        where: { bedNumber },
      });

      if (existingBed) {
        throw new MyError("Bed number already exists", 409);
      }

      const bed = await prisma.bed.create({
        data: {
          bedNumber,
          bedStatus,
        },
        include: {
          patient: true,
        },
      });

      res
        .status(201)
        .json(response(201, true, "Bed created successfully", bed));
    } catch (error) {
      next(error);
    }
  }

  static async getAllBeds(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        sortBy = "createdAt",
        order = "desc",
      } = req.query;

      const skip = (page - 1) * limit;

      // Build search conditions
      let whereCondition = {};

      if (search) {
        whereCondition.OR = [{ bedNumber: { contains: search } }];
      }

      if (status) {
        whereCondition.bedStatus = status;
      }

      // Get total count
      const total = await prisma.bed.count({
        where: whereCondition,
      });

      // Get beds with pagination
      const beds = await prisma.bed.findMany({
        where: whereCondition,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              status: true,
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
        response(200, true, "Beds retrieved successfully", {
          beds,
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

  static async getBedById(req, res, next) {
    try {
      const { id } = req.params;

      const bed = await prisma.bed.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!bed) {
        throw new MyError("Bed not found", 404);
      }

      res
        .status(200)
        .json(response(200, true, "Bed retrieved successfully", bed));
    } catch (error) {
      next(error);
    }
  }

  static async updateBed(req, res, next) {
    try {
      const { id } = req.params;
      const { bedNumber } = req.body;

      // Check if bed number is being changed and if it's already taken
      if (bedNumber) {
        const existingBed = await prisma.bed.findFirst({
          where: {
            bedNumber,
            NOT: {
              id,
            },
          },
        });

        if (existingBed) {
          throw new MyError("Bed number already taken", 409);
        }
      }

      const bed = await prisma.bed.update({
        where: { id },
        data: {
          bedNumber,
          bedStatus,
        },
        include: {
          patient: true,
        },
      });

      res
        .status(200)
        .json(response(200, true, "Bed updated successfully", bed));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("Bed not found", 404));
      } else {
        next(error);
      }
    }
  }

  static async deleteBed(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.bed.delete({
        where: { id },
      });

      res
        .status(200)
        .json(response(200, true, "Bed deleted successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        next(new MyError("Bed not found", 404));
      } else {
        next(error);
      }
    }
  }

  static async getAllBedsNoPagination(req, res, next) {
    try {
      const beds = await prisma.bed.findMany({
        where: {
          bedStatus: "Available",
        },
        orderBy: {
          bedNumber: "asc",
        },
      });

      res
        .status(200)
        .json(response(200, true, "All beds retrieved successfully", beds));
    } catch (error) {
      next(error);
    }
  }
}

export default BedController;
