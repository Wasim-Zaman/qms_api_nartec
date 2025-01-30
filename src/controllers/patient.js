import { assignDepartmentQueue } from "../config/queue.js";
import {
  assignBedSchema,
  assignDepartmentSchema,
  beginTimeSchema,
  createPatientSchema,
  createVitalSignSchema,
  dischargePatientSchema,
  endTimeSchema,
  getPatientsByDepartmentSchema,
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

        // assign default department (TRIAGE) to the patient
        const department = await prisma.tblDepartment.findFirst({
          where: {
            deptname: {
              contains: "TRIAGE",
            },
          },
        });

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
      const { dept } = req.query;

      // Base where condition for waiting patients
      const waitingWhereCondition = {
        state: 0,
        ...(dept && {
          departmentId: {
            equals: dept,
          },
        }),
      };

      // Base where condition for in-progress patients
      const inProgressWhereCondition = {
        state: 1,
        ...(dept && {
          departmentId: {
            equals: dept,
          },
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
          createdAt: "asc",
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
      const { idNumber, mobileNumber } = req.query;

      if (!idNumber && !mobileNumber) {
        throw new MyError(
          "Please provide either ID number or mobile number",
          400
        );
      }

      // Build search conditions
      const whereConditions = {
        OR: [],
      };

      if (idNumber) {
        whereConditions.OR.push({ idNumber: { equals: idNumber } });
      }

      if (mobileNumber) {
        whereConditions.OR.push({ mobileNumber: { equals: mobileNumber } });
      }

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
}

export default PatientController;
