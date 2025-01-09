import {
  createPatientSchema,
  updatePatientSchema,
} from "../schemas/patient.schema.js";
import MyError from "../utils/error.js";
import { addDomain } from "../utils/file.js";
import PDFGenerator from "../utils/pdfGenerator.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class PatientController {
  static async createPatient(req, res, next) {
    try {
      const { error, value } = createPatientSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const userId = req.user.id;

      // Use Prisma transaction to ensure data consistency
      const result = await prisma.$transaction(async (prisma) => {
        // Get current counter
        let currentCounter = await prisma.patientCount.findFirst({
          where: { userId },
          include: {
            user: true,
          },
          orderBy: {
            counter: "desc",
          },
        });

        if (!currentCounter) {
          currentCounter = await prisma.patientCount.create({
            data: {
              userId,
              counter: 1,
            },
          });
        }

        const counter = (currentCounter?.counter || 0) + 1;
        const ticket = `${currentCounter?.user?.deptcode}${counter}`;

        // Generate PDF ticket
        const pdfData = {
          patientName: value.name,
          ticket: ticket,
          deptcode: currentCounter?.user?.deptcode,
          counter: counter,
          issueDate: new Date(),
          cheifComplaint: value.cheifComplaint,
        };

        const { relativePath } = await PDFGenerator.generateTicket(pdfData);

        // Create patient record
        const patient = await prisma.patient.create({
          data: {
            ...value,
            userId,
            ticket: addDomain(relativePath),
          },
        });

        return patient;
      });

      res
        .status(200)
        .json(response(200, true, "Patient created successfully", result));
    } catch (error) {
      next(error);
    }
  }

  static async getAllPatients(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        order = "desc",
      } = req.query;

      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build search conditions
      const searchCondition = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { nationality: { contains: search, mode: "insensitive" } },
              { idNumber: { contains: search, mode: "insensitive" } },
              { ticket: { contains: search, mode: "insensitive" } },
              { cheifComplaint: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      // Get total count for pagination
      const total = await prisma.patient.count({
        where: searchCondition,
      });

      // Get paginated and filtered results
      const patients = await prisma.patient.findMany({
        where: searchCondition,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order.toLowerCase(),
        },
        skip,
        take: parseInt(limit),
      });

      res.status(200).json(
        response(200, true, "Patients retrieved successfully", {
          data: patients,
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

  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
      });

      if (!patient) {
        throw new MyError("Patient not found", 404);
      }

      res
        .status(200)
        .json(response(200, true, "Patient retrieved successfully", patient));
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updatePatientSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const patient = await prisma.patient.update({
        where: { id },
        data: value,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
      });

      res
        .status(200)
        .json(response(200, true, "Patient updated successfully", patient));
    } catch (error) {
      if (error.code === "P2025") {
        throw new MyError("Patient not found", 404);
      }
      next(error);
    }
  }

  static async deletePatient(req, res, next) {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.delete({
        where: { id },
      });

      res
        .status(200)
        .json(response(200, true, "Patient deleted successfully", null));
    } catch (error) {
      if (error.code === "P2025") {
        throw new MyError("Patient not found", 404);
      }
      next(error);
    }
  }
}

export default PatientController;
