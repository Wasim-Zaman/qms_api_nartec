import axios from "axios";
import { assignDepartmentQueue } from "../../config/queue.js";
import {
  assignDepartmentSchema,
  beginTimeSchema,
  callPatientSchema,
  createPatientSchema,
  createVitalSignSchema,
  dischargePatientSchema,
  endTimeSchema,
  getPatientJourneysSchema,
  getPatientsByDepartmentSchema,
  updatePatientSchema,
} from "../../schemas/patient.schema.js";
import socketService from "../../services/socket.js";
import MyError from "../../utils/error.js";
import { ensureRequiredDirs } from "../../utils/file.js";
import PDFGenerator from "../../utils/pdfGenerator.js";
import prisma from "../../utils/prismaClient.js";
import response from "../../utils/response.js";

class PatientControllerV2 {
  static async createPatient(req, res, next) {
    try {
      const { error, value } = createPatientSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      // Ensure all required directories exist before processing
      await ensureRequiredDirs();

      const userId = req.user.id;

      // check if patient already exists
      const existingPatient = await prisma.patient.findFirst({
        where: {
          userId,
          mobileNumber: value.mobileNumber,
          idNumber: value.idNumber,
          mrnNumber: value.mrnNumber,
        },
      });

      if (existingPatient) {
        //TODO: make sure it is post request, and redirect to re-register patient which is also a post request
        // use axios to make a post request to re-register patient
        // send bearer token in the request
        const token = req.headers.Authorization || req.headers.authorization;

        const response = await axios.post(
          `${process.env.DOMAIN}/api/v2/patients/re-register/${existingPatient.id}`,
          value,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );

        return res.status(200).json(response.data);
      }

      // Use Prisma transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Ensure state is 0 (waiting) for new patients
        if (value.state !== undefined && value.state !== 0) {
          throw new MyError("New patients must have state=0 (waiting)", 400);
        }

        // assign default department (TRIAGE) to the patient
        const department = await tx.tblDepartment.findFirst({
          where: {
            deptname: {
              contains: "TRIAGE",
            },
          },
        });

        // waiting count
        const waitingCount = await tx.patient.count({
          where: { state: 0, departmentId: department?.tblDepartmentID },
        });

        // Get current counter
        let currentCounter = await tx.patient.count({
          where: {
            registrationDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(),
            },
            // departmentId: department?.tblDepartmentID,
            state: {
              in: [0, 1, 2, 3], // 0: waiting, 1: in treatment, 2: discharged, 3: voided
            },
          },
        });

        let counter = (currentCounter || 0) + 1;

        // check if there is already a patient with the same ticket number
        const existingPatientWithSameTicket = await prisma.patient.findMany({
          where: {
            ticketNumber: {
              gte: counter,
            },
            // departmentId: department?.tblDepartmentID,
            registrationDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(),
            },
          },
          orderBy: {
            registrationDate: "desc",
          },
          take: 1,
        });

        if (existingPatientWithSameTicket.length > 0) {
          counter = existingPatientWithSameTicket[0].ticketNumber + 1;
        }

        const deptCode = department?.deptcode || "T"; // Get department code with fallback
        const ticket = `${deptCode}${counter}`;

        // Generate PDF ticket
        const pdfData = {
          patientName: value.name,
          ticket: ticket,
          deptcode: deptCode, // Use the deptCode we extracted from department
          counter: counter,
          issueDate: new Date(),
          cheifComplaint: value.cheifComplaint,
          waitingCount: waitingCount,
        };

        const { relativePath, barcodeBase64 } =
          await PDFGenerator.generateTicket(pdfData);

        // Create patient record
        const patient = await tx.patient.create({
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

        // create journey and make old active journey inactive
        await tx.journey.updateMany({
          where: { patientId: patient.id, isActive: true },
          data: { isActive: false },
        });

        const journey = await tx.journey.create({
          data: {
            patientId: patient.id,
            isActive: true,
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
      const result = await prisma.$transaction(async (prisma) => {
        const activeJourney = await prisma.journey.findFirst({
          where: { patientId: id, isActive: true },
        });

        if (activeJourney) {
          await prisma.journey.update({
            where: { id: activeJourney.id },
            data: { vitalTime: new Date() },
          });
        }

        return vitalSign;
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
        // get active journey
        const activeJourney = await prisma.journey.findFirst({
          where: { patientId: id, isActive: true },
        });

        if (activeJourney) {
          await prisma.journey.update({
            where: { id: activeJourney.id },
            data: {
              // set first call time and second call time
              ...(call === "first" && { firstCallTime: new Date() }),
              ...(call === "second" && { secondCallTime: new Date() }),
            },
          });
        }

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

      // update journey with assign department time
      const activeJourney = await prisma.journey.findFirst({
        where: { patientId: id, isActive: true },
      });

      if (activeJourney) {
        await prisma.journey.update({
          where: { id: activeJourney.id },
          data: { assignDeptTime: new Date() },
        });
      }

      // assign department to patient
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

  static async setBeginTime(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = beginTimeSchema.validate(req.body);
      if (error) {
        throw new MyError(error.details[0].message, 400);
      }

      // check if bed is assigned to the patient or not
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: { bed: true },
      });

      if (!patient.bed) {
        throw new MyError("Bed is not assigned to the patient", 400);
      }
      const beginTime = value.beginTime || new Date();

      const updatedPatient = await prisma.$transaction(async (prisma) => {
        const updatedPatient = await prisma.patient.update({
          where: { id },
          data: { beginTime, state: 1, callPatient: false }, // set patient state to 1 (In Treatment)
          include: {
            bed: true,
            department: true,
          },
        });

        // update journey with assign department time
        const activeJourney = await prisma.journey.findFirst({
          where: { patientId: id, isActive: true },
        });

        if (activeJourney) {
          await prisma.journey.update({
            where: { id: activeJourney.id },
            data: { beginTime: beginTime },
          });
        }

        return updatedPatient;
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

        // update journey
        const activeJourney = await tx.journey.findFirst({
          where: {
            patientId: id,
            endTime: null,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            },
          },
        });

        if (!activeJourney?.beginTime) {
          throw new MyError("Patient begin time is not set", 400);
        }

        if (activeJourney) {
          await tx.journey.update({
            where: { id: activeJourney.id, isActive: true },
            data: { endTime, isActive: false },
          });
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // // Delete ticket pdf
        // if (patient.ticket) {
        //   await deleteFile(patient.ticket);
        // }

        // Update patient
        return await tx.patient.update({
          where: { id },
          data: {
            endTime,
            state: 2, // Patient is discharged | Served
            // ticket: null,
            // barcode: null,
            bedId: null, // remove bed assignment
            remarks: "Patient discharged on End Time",
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

        // get active journey and update it
        const activeJourney = await tx.journey.findFirst({
          where: { patientId: id, isActive: true },
        });

        if (activeJourney) {
          await tx.journey.update({
            where: { id: activeJourney.id, isActive: true },
            data: { endTime, isActive: false },
          });
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // // Delete ticket pdf
        // if (patient.ticket) {
        //   await deleteFile(patient.ticket);
        // }

        // Update patient
        return await tx.patient.update({
          where: { id },
          data: {
            endTime,
            state: 3, // Patient is voided
            // ticket: null,
            // barcode: null,
            bedId: null, // remove bed assignment
            remarks: "Patient voided",
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

      const endTime = value.endTime || new Date();

      const updatedPatient = await prisma.$transaction(async (tx) => {
        const remarks = value.remarks;

        const patient = await tx.patient.findUnique({
          where: { id },
        });

        if (!patient) {
          throw new MyError("Patient not found", 404);
        }

        // get active journey and update it
        const activeJourney = await tx.journey.findFirst({
          where: {
            patientId: id,
            endTime: null,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            },
          },
        });

        if (activeJourney) {
          await tx.journey.update({
            where: { id: activeJourney.id, isActive: true },
            data: { endTime, isActive: false },
          });
        }

        // If patient has a bed, update its status to release it
        if (patient.bedId) {
          await tx.bed.update({
            where: { id: patient.bedId },
            data: { bedStatus: "Available" },
          });
        }

        // // Delete ticket pdf
        // if (patient.ticket) {
        //   await deleteFile(patient.ticket);
        // }

        return await tx.patient.update({
          where: { id },
          data: {
            state: 2, // Patient is discharged | Served
            // ticket: null,
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
      const userId = req?.user?.id; // From auth middleware

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

      // check if patient's active journey is ended or not for the current day
      const activeJourney = await prisma.journey.findFirst({
        where: {
          patientId: id,
          endTime: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
          },
        },
      });

      if (activeJourney) {
        return res
          .status(400)
          .json(
            response(400, false, "Patient's active journey is not ended", null)
          );
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
          where: {
            registrationDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(),
            },
            // departmentId: department?.tblDepartmentID,
            state: {
              in: [0, 1, 2, 3],
            },
          },
        });

        let counter = (currentCounter || 0) + 1;

        // check if there is already a patient with the same ticket number
        const existingPatientWithSameTicket = await prisma.patient.findMany({
          where: {
            ticketNumber: {
              gte: counter,
            },
            // departmentId: department?.tblDepartmentID,
            registrationDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(),
            },
          },
          orderBy: {
            registrationDate: "desc",
          },
          take: 1,
        });

        if (existingPatientWithSameTicket.length > 0) {
          counter = existingPatientWithSameTicket[0].ticketNumber + 1;
        }

        const deptCode = department?.deptcode || "T"; // Get department code with fallback
        const ticket = `${deptCode}${counter}`;

        console.log("ticket", ticket);
        console.log("currentCounter", currentCounter);
        console.log("counter", counter);

        // Generate PDF ticket
        const pdfData = {
          patientName: value.name,
          ticket: ticket,
          deptcode: deptCode, // Use the deptCode we extracted from department
          counter: counter,
          issueDate: new Date(),
          cheifComplaint: value.cheifComplaint,
          waitingCount: waitingCount,
        };

        const { relativePath, barcodeBase64 } =
          await PDFGenerator.generateTicket(pdfData);

        // create journey and make old active journey inactive
        await tx.journey.updateMany({
          where: { patientId: id, isActive: true },
          data: { isActive: false },
        });

        await tx.journey.create({
          data: {
            patientId: id,
            isActive: true,
          },
        });

        const patient = await tx.patient.update({
          where: { id },
          data: {
            ...value,
            state: 0, // waiting
            ticket: relativePath,
            barcode: barcodeBase64,
            ticketNumber: Number(counter),
            registrationDate: new Date(),
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
          journeys: true,
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
        // journey: {
        //   registration: patient.createdAt,
        //   firstCall: patient.firstCallTime,
        //   vitalSigns: patient.vitalTime,
        //   departmentAssigned: patient.assignDeptTime,
        //   secondCall: patient.secondCallTime,
        //   treatmentBegan: patient.beginTime,
        //   treatmentEnded: patient.endTime,
        // },
        journeys: patient.journeys,
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
}

export default PatientControllerV2;
