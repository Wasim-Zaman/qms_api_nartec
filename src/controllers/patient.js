import {
  createPatientSchema,
  createVitalSignSchema,
  updatePatientSchema,
} from "../schemas/patient.schema.js";
import socketService from "../services/socket.js";
import MyError from "../utils/error.js";
import { deleteFile, ensureRequiredDirs } from "../utils/file.js";
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

      //   // Add patient to queue
      //   await patientQueue.add("add-patient", { userId: req.user.id, value });

      // Ensure all required directories exist before processing
      await ensureRequiredDirs();

      const userId = req.user.id;

      // Use Prisma transaction to ensure data consistency
      const result = await prisma.$transaction(async (prisma) => {
        // Ensure state is 0 (waiting) for new patients
        if (value.state !== undefined && value.state !== 0) {
          throw new MyError("New patients must have state=0 (waiting)", 400);
        }

        // waiting count
        const waitingCount = await prisma.patient.count({
          where: { state: 0 },
        });

        // Get current counter
        let currentCounter = await prisma.patient.count({
          // count all the patients for last day
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 1)),
            },
          },
        });

        const counter = (currentCounter || 0) + 1;
        const ticket = `${currentCounter?.user?.deptcode}${counter}`;

        // Generate PDF ticket
        const pdfData = {
          patientName: value.name,
          ticket: ticket,
          deptcode: currentCounter?.user?.deptcode,
          counter: counter,
          issueDate: new Date(),
          cheifComplaint: value.cheifComplaint,
          waitingCount: waitingCount,
        };

        const { relativePath, barcodeBase64 } =
          await PDFGenerator.generateTicket(pdfData);

        // Create patient record
        const patient = await prisma.patient.create({
          data: {
            ...value,
            userId,
            ticket: relativePath,
            barcode: barcodeBase64,
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

      const userId = req.user.id; // Get current user's ID from auth middleware

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
          vitalSigns: true,
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

      const existingPatient = await prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        throw new MyError("Patient not found", 404);
      }

      // delete ticket pdf
      const ticketPdfPath = existingPatient.ticket;
      if (ticketPdfPath) {
        await deleteFile(ticketPdfPath);
      }

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

  static async getPatientsByState(req, res, next) {
    try {
      // Get patients with state 0 (waiting)
      const waitingPatients = await prisma.patient.findMany({
        where: { state: 0 },
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
          createdAt: "asc",
        },
      });

      // Get patients with state 1 (in progress)
      const inProgressPatients = await prisma.patient.findMany({
        where: { state: 1 },
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
          createdAt: "asc",
        },
      });

      res.status(200).json(
        response(200, true, "Patients retrieved successfully", {
          waiting: waitingPatients,
          inProgress: inProgressPatients,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async createVitalSign(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = createVitalSignSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const patient = await prisma.patient.findUnique({
        where: { id },
      });

      if (!patient) {
        throw new MyError("Patient not found", 404);
      }

      const vitalSign = await prisma.vitalSign.create({
        data: {
          ...value,
          patientId: id,
        },
      });

      res
        .status(200)
        .json(
          response(200, true, "Vital sign created successfully", vitalSign)
        );
    } catch (error) {
      next(error);
    }
  }

  static async togglePatientCall(req, res, next) {
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

      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          callPatient: !patient.callPatient,
        },
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

      // Emit socket event if patient is being called
      if (updatedPatient.callPatient) {
        socketService.emitPatientCall({
          id: updatedPatient.id,
          name: updatedPatient.name,
          ticket: updatedPatient.ticket,
          deptcode: updatedPatient.user?.deptcode,
        });
      }

      res
        .status(200)
        .json(
          response(
            200,
            true,
            "Patient call status toggled successfully",
            updatedPatient
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async getCalledPatients(req, res, next) {
    try {
      const calledPatients = await prisma.patient.findMany({
        where: {
          callPatient: true,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
          vitalSigns: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      res
        .status(200)
        .json(
          response(
            200,
            true,
            "Called patients retrieved successfully",
            calledPatients
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export default PatientController;
