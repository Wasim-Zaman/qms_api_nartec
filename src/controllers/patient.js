import path from "path";
import xlsx from "xlsx";
import { assignDepartmentQueue } from "../config/queue.js";
import {
  assignBedSchema,
  assignDepartmentSchema,
  beginTimeSchema,
  callPatientSchema,
  createPatientSchema,
  createVitalSignSchema,
  dischargePatientSchema,
  endTimeSchema,
  getPatientJourneysSchema,
  getPatientsByDepartmentSchema,
  searchPatientSchema,
  updatePatientSchema,
} from "../schemas/patient.schema.js";
import socketService from "../services/socket.js";
import MyError from "../utils/error.js";
import { deleteFile, ensureDir, ensureRequiredDirs } from "../utils/file.js";
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

        // assign default department (TRIAGE) to the patient
        const department = await prisma.tblDepartment.findFirst({
          where: {
            deptname: {
              contains: "TRIAGE",
            },
          },
        });

        // waiting count
        const waitingCount = await prisma.patient.count({
          where: { state: 0, departmentId: department?.tblDepartmentID },
        });

        // Get current counter
        let currentCounter = await prisma.patient.count({
          // count all the patients for last day
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 1)),
            },
            departmentId: department?.tblDepartmentID,
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
            ticketNumber: Number(counter),
            // connect with department
            departmentId: department ? department.tblDepartmentID : null,
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

      const userId = req.user?.id; // Get current user's ID from auth middleware

      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build search conditions
      const searchCondition = search
        ? {
            OR: [
              { name: { contains: search } },
              { nationality: { contains: search } },
              { idNumber: { contains: search } },
              { ticket: { contains: search } },
              { cheifComplaint: { contains: search } },
              { mobileNumber: { contains: search } },
              { sex: { contains: search } },
              { bloodGroup: { contains: search } },
            ],
          }
        : {};

      // Get total count for pagination
      const total = await prisma.patient.count({
        where: {
          userId,
          ...searchCondition,
        },
      });

      // Get paginated patients with search
      const patients = await prisma.patient.findMany({
        where: {
          userId,
          ...searchCondition,
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
          department: true,
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
          department: true,
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
      });

      //   // Update ticket
      //   await updateTicketQueue.add("update-ticket", {
      //     id,
      //     value,
      //     patient,
      //   });

      // waiting count
      const waitingCount = await prisma.patient.count({
        where: { state: 0 },
      });

      // Get current counter
      // let currentCounter = await prisma.patient.count({
      //   // count all the patients for last day
      //   where: {
      //     createdAt: {
      //       gte: new Date(new Date().setDate(new Date().getDate() - 1)),
      //     },
      //   },
      // });

      // Delete old ticket if exists
      if (patient.ticket) {
        await deleteFile(patient.ticket);
      }

      let updatedPatient;

      if (
        patient?.vitalSigns &&
        patient?.vitalSigns?.length != 0 &&
        !patient?.department
      ) {
        // Generate department ticket
        const { relativePath, barcodeText } =
          await PDFGenerator.generateDepartmentTicket({
            ...patient,
            department: patient.department,
            ticketNumber: patient.ticketNumber,
            barcode: patient.barcode,
            vitalSigns: patient.vitalSigns[0],
            waitingCount,
            issueDate: new Date(),
            counter: patient.ticketNumber,
          });

        // Update patient with new department and ticket
        updatedPatient = await prisma.patient.update({
          where: { id },
          data: {
            ticket: relativePath,
            barcode: barcodeText,
          },
        });
      } else {
        // Generate PDF ticket
        const pdfData = {
          patientName: patient.name,
          ticket: patient.ticket,
          deptcode: patient.user?.deptcode,
          counter: patient.ticketNumber,
          issueDate: new Date(),
          cheifComplaint: patient.cheifComplaint,
          waitingCount: waitingCount,
        };

        const { relativePath, barcodeBase64 } =
          await PDFGenerator.generateTicket(pdfData);

        // Update patient with new department and ticket
        updatedPatient = await prisma.patient.update({
          where: { id },
          data: {
            ticket: relativePath,
            barcode: barcodeBase64,
          },
        });
      }

      res
        .status(200)
        .json(
          response(200, true, "Patient updated successfully", updatedPatient)
        );
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
        include: {
          bed: true,
        },
      });

      if (!existingPatient) {
        throw new MyError("Patient not found", 404);
      }

      // delete ticket pdf
      const ticketPdfPath = existingPatient.ticket;
      if (ticketPdfPath) {
        await deleteFile(ticketPdfPath);
      }

      const patient = await prisma.$transaction(async (tx) => {
        // If patient has a bed, update its status to release it
        if (existingPatient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        const patient = await prisma.patient.delete({
          where: { id },
        });

        return patient;
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
      let { deptId } = req.query;

      if (!deptId) {
        const department = await prisma.tblDepartment.findFirst({
          where: {
            deptname: {
              contains: "TRIAGE",
            },
          },
        });

        deptId = department?.tblDepartmentID;
      }

      // Base where condition for waiting patients
      const waitingWhereCondition = {
        state: 0,
        ...(deptId && {
          departmentId: deptId,
        }),
      };

      // Base where condition for in-progress patients
      const inProgressWhereCondition = {
        state: 1,
        ...(deptId && {
          departmentId: deptId,
        }),
      };

      // Get patients with state 0 (waiting)
      const waitingPatients = await prisma.patient.findMany({
        where: waitingWhereCondition,
        include: {
          department: true,
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
        orderBy: {
          ticketNumber: "asc",
        },
      });

      // Get patients with state 1 (in progress)
      const inProgressPatients = await prisma.patient.findMany({
        where: inProgressWhereCondition,
        include: {
          department: true,
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

      // Get counts
      const counts = {
        waiting: waitingPatients.length,
        inProgress: inProgressPatients.length,
        total: waitingPatients.length + inProgressPatients.length,
      };

      res.status(200).json(
        response(200, true, "Patients retrieved successfully", {
          waiting: waitingPatients,
          inProgress: inProgressPatients,
          counts,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getAllNonDischargedPatients(req, res, next) {
    try {
      const patients = await prisma.patient.findMany({
        where: {
          // department is not TRIAGE
          department: {
            deptname: {
              not: {
                contains: "TRIAGE",
              },
            },
          },
          OR: [{ state: 0 }, { state: 1 }],
        },
        include: {
          department: true,
          user: {
            select: {
              name: true,
              email: true,
              deptcode: true,
            },
          },
        },
        orderBy: {
          ticketNumber: "asc",
        },
      });

      res
        .status(200)
        .json(response(200, true, "Patients retrieved successfully", patients));
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
        include: {
          vitalSigns: true,
        },
      });

      if (!patient) {
        throw new MyError("Patient not found", 404);
      }

      let vitalSign;

      // check if patient has already vital signs
      if (patient?.vitalSigns?.length) {
        // update the existing vital sign
        vitalSign = await prisma.vitalSign.update({
          where: { id: patient.vitalSigns[0].id },
          data: value,
        });
      } else {
        // create new vital sign
        vitalSign = await prisma.vitalSign.create({
          data: {
            ...value,
            patientId: id,
          },
        });
      }

      // update patient with vital time
      await prisma.patient.update({
        where: { id },
        data: { vitalTime: new Date() },
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
      const { error, value } = callPatientSchema.validate(req.query);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { call } = value;

      // Assign job to queue
      //   await patientCallQueue.add("toggle-patient-call", { id });

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          department: true,
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

      const result = await prisma.$transaction(async (prisma) => {
        const updatedPatient = await prisma.patient.update({
          where: { id },
          data: {
            callPatient: !patient.callPatient,

            // set first call time and second call time
            ...(call === "first" && { firstCallTime: new Date() }),
            ...(call === "second" && { secondCallTime: new Date() }),
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
        socketService.emitPatientCall({
          id: updatedPatient.id,
          name: updatedPatient.name,
          ticket: updatedPatient.ticket,
          deptcode: updatedPatient.user?.deptcode,
        });

        return updatedPatient;
      });

      res
        .status(200)
        .json(
          response(
            200,
            true,
            "Patient call status toggled successfully",
            result
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
          department: true,
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

  static async assignDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = assignDepartmentSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          vitalSigns: true,
        },
      });

      if (!patient) {
        throw new MyError("Patient not found", 404);
      }

      // Check if patient has vital signs
      if (!patient.vitalSigns.length) {
        throw new MyError(
          "Patient has no vital signs, please add vital signs first",
          400
        );
      }

      // Check if department exists
      const department = await prisma.tblDepartment.findUnique({
        where: { tblDepartmentID: value.departmentId },
      });

      if (!department) {
        throw new MyError("Department not found", 404);
      }

      //   // Get latest patient count for ticket number
      //   const ticketNumber = patient.ticketNumber;

      //   // Generate barcode
      //   const barcode = patient.barcode;

      //   // waiting count
      //   const waitingCount = await prisma.patient.count({
      //     where: { state: 0 },
      //   });

      //   // Get current counter
      //   let currentCounter = await prisma.patient.count({
      //     // count all the patients for last day
      //     where: {
      //       createdAt: {
      //         gte: new Date(new Date().setDate(new Date().getDate() - 1)),
      //       },
      //     },
      //   });

      //   // Generate department ticket
      //   const ticketData = await PDFGenerator.generateDepartmentTicket({
      //     ...patient,
      //     department,
      //     ticketNumber,
      //     barcode,
      //     vitalSigns: patient.vitalSigns[0],
      //     waitingCount,
      //     issueDate: new Date(),
      //     counter: currentCounter,
      //   });

      //   // Delete old ticket if exists
      //   if (patient.ticket) {
      //     await deleteFile(patient.ticket);
      //   }

      //   // Update patient with new department and ticket
      //   const updatedPatient = await prisma.patient.update({
      //     where: { id },
      //     data: {
      //       departmentId: value.departmentId,
      //       ticket: ticketData.relativePath,
      //       ticketNumber,
      //       barcode,
      //     },
      //     include: {
      //       department: true,
      //       vitalSigns: true,
      //       user: {
      //         select: {
      //           name: true,
      //           email: true,
      //           deptcode: true,
      //         },
      //       },
      //     },
      //   });

      await assignDepartmentQueue.add("assign-department", {
        id,
        value,
        patient,
        department,
      });

      res
        .status(200)
        .json(
          response(200, true, "Department assigned to patient successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  static async assignBed(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = assignBedSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      // Check if bed exists and is available
      const bed = await prisma.bed.findUnique({
        where: { id: value.bedId },
        include: { patient: true },
      });

      if (!bed) {
        throw new MyError("Bed not found", 404);
      }

      if (bed.bedStatus === "Occupied") {
        throw new MyError("Bed is already occupied", 400);
      }

      // Update patient and bed in a transaction
      const updatedPatient = await prisma.$transaction(async (tx) => {
        // Update bed status
        await tx.bed.update({
          where: { id: value.bedId },
          data: { bedStatus: "Occupied" },
        });

        // Update patient with bed assignment
        return await tx.patient.update({
          where: { id },
          data: { bedId: value.bedId },
          include: {
            bed: true,
            department: true,
          },
        });
      });

      res
        .status(200)
        .json(response(200, true, "Bed assigned successfully", updatedPatient));
    } catch (error) {
      next(error);
    }
  }

  static async setBeginTime(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = beginTimeSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const beginTime = value.beginTime || new Date();

      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: { beginTime },
        include: {
          bed: true,
          department: true,
        },
      });

      res
        .status(200)
        .json(
          response(200, true, "Begin time set successfully", updatedPatient)
        );
    } catch (error) {
      next(error);
    }
  }

  static async setEndTime(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = endTimeSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }
      const endTime = value.endTime || new Date();

      // Update patient and free up bed in a transaction
      const updatedPatient = await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({
          where: { id },
          include: { bed: true },
        });

        if (!patient) {
          throw new MyError("Patient not found", 404);
        }

        if (!patient.beginTime) {
          throw new MyError("Patient begin time is not set", 400);
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // Delete ticket pdf
        if (patient.ticket) {
          await deleteFile(patient.ticket);
        }

        // Update patient
        return await tx.patient.update({
          where: { id },
          data: {
            endTime,
            state: 2, // Patient is discharged | Served
            ticket: null,
            barcode: null,
            bedId: null, // remove bed assignment
            callPatient: false,
          },
          include: {
            department: true,
          },
        });
      });

      res
        .status(200)
        .json(response(200, true, "End time set successfully", updatedPatient));
    } catch (error) {
      next(error);
    }
  }

  static async voidPatient(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = endTimeSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }
      const endTime = value.endTime || new Date();

      // Update patient and free up bed in a transaction
      const updatedPatient = await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({
          where: { id },
          include: { bed: true },
        });

        if (!patient) {
          throw new MyError("Patient not found", 404);
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // Delete ticket pdf
        if (patient.ticket) {
          await deleteFile(patient.ticket);
        }

        // Update patient
        return await tx.patient.update({
          where: { id },
          data: {
            endTime,
            state: 3, // Patient is voided
            ticket: null,
            barcode: null,
            bedId: null, // remove bed assignment
            callPatient: false,
          },
          include: {
            department: true,
          },
        });
      });

      res
        .status(200)
        .json(response(200, true, "End time set successfully", updatedPatient));
    } catch (error) {
      next(error);
    }
  }

  static async dischargePatient(req, res, next) {
    try {
      const { id } = req.params;

      const { error, value } = dischargePatientSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const updatedPatient = await prisma.$transaction(async (tx) => {
        const remarks = value.remarks;

        const patient = await tx.patient.findUnique({
          where: { id },
        });

        if (!patient) {
          throw new MyError("Patient not found", 404);
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // Delete ticket pdf
        if (patient.ticket) {
          await deleteFile(patient.ticket);
        }

        return await tx.patient.update({
          where: { id },
          data: {
            state: 2, // Patient is discharged | Served
            ticket: null,
            // barcode: null,
            bedId: null, // remove bed assignment
            remarks,
            callPatient: false,
          },
          include: {
            department: true,
          },
        });
      });

      res
        .status(200)
        .json(
          response(200, true, "Patient discharged successfully", updatedPatient)
        );
    } catch (error) {
      next(error);
    }
  }

  static async getPatientsByDepartment(req, res, next) {
    try {
      const { error, value } = getPatientsByDepartmentSchema.validate(
        req.query
      );
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { deptId } = value; // Removed search parameter

      const patients = await prisma.patient.findMany({
        where: {
          departmentId: deptId,
          NOT: {
            state: 2,
          },
        },
        include: {
          department: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res
        .status(200)
        .json(response(200, true, "Patients retrieved successfully", patients));
    } catch (error) {
      next(error);
    }
  }

  static async searchPatients(req, res, next) {
    try {
      const { error, value } = searchPatientSchema.validate(req.query);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const { searchKey } = value;

      // Build search conditions to check against all three fields
      const whereConditions = {
        OR: [
          { idNumber: { equals: searchKey } },
          { mobileNumber: { equals: searchKey } },
          { mrnNumber: { equals: searchKey } },
        ],
      };

      const patient = await prisma.patient.findFirst({
        where: whereConditions,
        include: {
          department: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          bed: true,
          vitalSigns: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
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

  static async reRegisterPatient(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // From auth middleware

      const { error, value } = updatePatientSchema.validate(req.body);

      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      // Find existing patient
      const existingPatient = await prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        throw new MyError("Patient not found", 404);
      }

      // we will update the patient data, and reset the state to 0 (waiting), delete the ticket and barcode

      const result = await prisma.$transaction(async (tx) => {
        // assign default department (TRIAGE) to the patient
        const department = await tx.tblDepartment.findFirst({
          where: {
            deptname: {
              contains: "TRIAGE",
            },
          },
        });

        // waiting count
        const waitingCount = await prisma.patient.count({
          where: { state: 0, departmentId: department?.tblDepartmentID },
        });

        // Get current counter
        let currentCounter = await prisma.patient.count({
          // count all the patients for last day
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 1)),
            },
            departmentId: department?.tblDepartmentID,
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

        const patient = await tx.patient.update({
          where: { id },
          data: {
            ...value,
            state: 0, // waiting
            ticket: relativePath,
            barcode: barcodeBase64,
            departmentId: department ? department.tblDepartmentID : null,
            bedId: null,
            beginTime: null,
            endTime: null,
            callPatient: false,
            vitalSigns: {
              deleteMany: {},
            },
          },
          include: {
            department: true,
            user: true,
          },
        });

        return patient;
      });

      res
        .status(201)
        .json(
          response(201, true, "Patient re-registered successfully", result)
        );
    } catch (error) {
      next(error);
    }
  }

  // get patient journey time
  static async getPatientJourneyTime(req, res, next) {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        select: {
          createdAt: true,
          firstCallTime: true,
          secondCallTime: true,
          vitalTime: true,
          assignDeptTime: true,
          beginTime: true,
          endTime: true,
        },
      });

      if (!patient) {
        throw new MyError("Patient not found", 404);
      }

      res
        .status(200)
        .json(
          response(
            200,
            true,
            "Patient journey time retrieved successfully",
            patient
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async getPatientJourneys(req, res, next) {
    try {
      const { error, value } = getPatientJourneysSchema.validate(req.query);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      const {
        page,
        limit,
        search,
        sortBy,
        order,
        startDate,
        endDate,
        state,
        status,
        sex,
        departmentId,
        age,
        hasVitalSigns,
        hasBed,
      } = value;

      const skip = (page - 1) * limit;

      // Build where condition
      const whereCondition = {
        AND: [
          // Search condition
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { mrnNumber: { contains: search } },
                  { idNumber: { contains: search } },
                  { mobileNumber: { contains: search } },
                  { user: { name: { contains: search } } },
                  { remarks: { contains: search } },
                  { cheifComplaint: { contains: search } },
                ],
              }
            : {},
          // Date range
          startDate ? { createdAt: { gte: new Date(startDate) } } : {},
          endDate ? { createdAt: { lte: new Date(endDate) } } : {},
          // State
          state !== undefined ? { state } : {},
          // Status
          status ? { status } : {},
          // Sex
          sex ? { sex } : {},
          // Department
          departmentId ? { departmentId } : {},
          // Age range
          age?.min ? { age: { gte: age.min } } : {},
          age?.max ? { age: { lte: age.max } } : {},
          // Vital signs
          hasVitalSigns !== undefined
            ? {
                vitalSigns: hasVitalSigns ? { some: {} } : { none: {} },
              }
            : {},
          // Bed assignment
          hasBed !== undefined
            ? {
                bedId: hasBed ? { not: null } : null,
              }
            : {},
        ],
      };

      const total = await prisma.patient.count({ where: whereCondition });

      const patients = await prisma.patient.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          mrnNumber: true,
          bloodGroup: true,
          age: true,
          sex: true,
          idNumber: true,
          mobileNumber: true,
          status: true,
          state: true,
          createdAt: true,
          firstCallTime: true,
          vitalTime: true,
          assignDeptTime: true,
          secondCallTime: true,
          beginTime: true,
          endTime: true,
          department: {
            select: {
              tblDepartmentID: true,
              deptname: true,
            },
          },
          bed: {
            select: {
              id: true,
              bedNumber: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: order },
      });

      const journeys = patients.map((patient) => ({
        patientId: patient.id,
        name: patient.name,
        mrnNumber: patient.mrnNumber,
        bloodGroup: patient.bloodGroup,
        age: patient.age,
        sex: patient.sex,
        idNumber: patient.idNumber,
        mobileNumber: patient.mobileNumber,
        status: patient.status,
        state: patient.state,
        department: patient.department,
        bed: patient.bed,
        journey: {
          registration: patient.createdAt,
          firstCall: patient.firstCallTime,
          vitalSigns: patient.vitalTime,
          departmentAssigned: patient.assignDeptTime,
          secondCall: patient.secondCallTime,
          treatmentBegan: patient.beginTime,
          treatmentEnded: patient.endTime,
        },
      }));

      res.status(200).json(
        response(200, true, "Patient journeys retrieved", {
          data: journeys,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async exportPatientsToExcel(req, res, next) {
    try {
      //  const patients = await prisma.patient.findMany({
      //    select: {
      //      id: true,
      //      name: true,
      //      mrnNumber: true,
      //      bloodGroup: true,
      //      age: true,
      //      sex: true,
      //      idNumber: true,
      //      mobileNumber: true,
      //      status: true,
      //      state: true,
      //      createdAt: true,
      //      firstCallTime: true,
      //      vitalTime: true,
      //      assignDeptTime: true,
      //      secondCallTime: true,
      //      beginTime: true,
      //      endTime: true,
      //      department: {
      //        select: {
      //          deptname: true,
      //        },
      //      },
      //      bed: {
      //        select: {
      //          bedNumber: true,
      //        },
      //      },
      //    },
      //    orderBy: {
      //      createdAt: "desc",
      //    },
      //  });

      //  // Transform data for Excel
      //  const excelData = patients.map((patient) => ({
      //    "Patient Name": patient.name,
      //    "MRN Number": patient.mrnNumber,
      //    "Blood Group": patient.bloodGroup,
      //    Age: patient.age,
      //    Gender: patient.sex,
      //    "ID Number": patient.idNumber,
      //    Mobile: patient.mobileNumber,
      //    Status: patient.status,
      //    Department: patient.department?.deptname || "N/A",
      //    "Bed Number": patient.bed?.bedNumber || "N/A",
      //    "Registration Time": patient.createdAt
      //      ? new Date(patient.createdAt).toLocaleString()
      //      : "N/A",
      //    "First Call Time": patient.firstCallTime
      //      ? new Date(patient.firstCallTime).toLocaleString()
      //      : "N/A",
      //    "Vital Signs Time": patient.vitalTime
      //      ? new Date(patient.vitalTime).toLocaleString()
      //      : "N/A",
      //    "Department Assigned Time": patient.assignDeptTime
      //      ? new Date(patient.assignDeptTime).toLocaleString()
      //      : "N/A",
      //    "Second Call Time": patient.secondCallTime
      //      ? new Date(patient.secondCallTime).toLocaleString()
      //      : "N/A",
      //    "Treatment Begin Time": patient.beginTime
      //      ? new Date(patient.beginTime).toLocaleString()
      //      : "N/A",
      //    "Treatment End Time": patient.endTime
      //      ? new Date(patient.endTime).toLocaleString()
      //      : "N/A",
      //  }));
      // Get all patients with their journey details
      const patients = await prisma.patient.findMany({
        select: {
          id: true,
          name: true,
          mrnNumber: true,
          bloodGroup: true,
          age: true,
          sex: true,
          idNumber: true,
          mobileNumber: true,
          status: true,
          state: true,
          journeys: true,
          department: {
            select: {
              deptname: true,
            },
          },
          bed: {
            select: {
              bedNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform data for Excel
      const excelData = [];
      patients.forEach((patient) => {
        patient.journeys.forEach((journey) => {
          excelData.push({
            "Patient Name": patient.name,
            "MRN Number": patient.mrnNumber,
            "Blood Group": patient.bloodGroup,
            Age: patient.age,
            Sex: patient.sex,
            "ID Number": patient.idNumber,
            "Mobile Number": patient.mobileNumber,
            Department: patient.department?.deptname,
            "Bed Number": patient.bed?.bedNumber,
            "Registration Time": journey.createdAt,
            "First Call Time": journey.firstCallTime,
            "Vital Signs Time": journey.vitalTime,
            "Department Assigned Time": journey.assignDeptTime,
            "Second Call Time": journey.secondCallTime,
            "Treatment Begin Time": journey.beginTime,
            "Treatment End Time": journey.endTime,
          });
        });
      });

      // Create workbook and worksheet
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, "Patient Journeys");

      // Ensure dir
      await ensureDir("uploads/exports");

      // Generate Excel file
      const exportPath = path.join(process.cwd(), "uploads", "exports");
      await ensureRequiredDirs(exportPath);

      const fileName = `patient_journeys_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const filePath = path.join(exportPath, fileName);

      // Write file
      xlsx.writeFile(workbook, filePath);

      // Send file to client
      res.download(filePath, fileName, async (err) => {
        if (err) {
          next(new MyError("Error downloading file", 500));
        }
        // Optionally delete the file after sending
        await deleteFile(filePath);
        // fs.unlinkSync(filePath);
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PatientController;
