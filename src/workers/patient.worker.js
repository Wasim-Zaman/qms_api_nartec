import { Worker } from "bullmq";

import { connection } from "../config/queue.js";
import socketService from "../services/socket.js";
import MyError from "../utils/error.js";
import { addDomain, deleteFile, ensureRequiredDirs } from "../utils/file.js";
import PDFGenerator from "../utils/pdfGenerator.js";
import prisma from "../utils/prismaClient.js";

const processPatient = async (job) => {
  try {
    // Ensure all required directories exist before processing
    await ensureRequiredDirs();

    const { userId, value } = job.data;

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

      // Update counter
      await prisma.patientCount.update({
        where: { id: currentCounter.id },
        data: { counter: counter + 1 },
      });

      return patient;
    });
  } catch (error) {
    console.error("Error processing patient:", error);
    throw error;
  }
};

const processPatientCall = async (job) => {
  try {
    const { id } = job.data;
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
  } catch (error) {
    throw error;
  }
};

const processAssignDepartment = async (job) => {
  try {
    const { id, value, patient, department } = job.data;

    // Get latest patient count for ticket number
    const ticketNumber = patient.ticketNumber;

    // Generate barcode
    const barcode = patient.barcode;

    // waiting count
    const waitingCount = await prisma.patient.count({
      where: {
        state: {
          in: [0, 1],
        },
        departmentId: value.departmentId,
      },
    });

    // Get current counter
    let currentCounter = await prisma.patient.count({
      where: {
        departmentId: value.departmentId,
        registrationDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
        state: {
          in: [0, 1, 2, 3],
        },
      },
    });

    console.log("currentCounter", currentCounter);

    let counter = Number(currentCounter) + 1;

    // check if there is already a patient with the same ticket number
    const existingPatientWithSameTicket = await prisma.patient.findMany({
      where: {
        ticketNumber: {
          gte: counter,
        },
        departmentId: value.departmentId,
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
    // Generate department ticket
    const ticketData = await PDFGenerator.generateDepartmentTicket({
      ...patient,
      department,
      //   ticketNumber: counter,
      ticketNumber: ticketNumber,
      barcode,
      vitalSigns: patient.vitalSigns[0],
      waitingCount,
      issueDate: new Date(),
      //   counter: counter,
      counter: ticketNumber,
    });

    // Delete old ticket if exists
    if (patient.ticket) {
      await deleteFile(patient.ticket);
    }

    // Update patient with new department and ticket
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        departmentId: value.departmentId,
        ticket: ticketData.relativePath,
        // ticketNumber: counter,
        barcode,
        registrationDate: new Date(),
        state: 0, // 0: waiting, 1: serving, 2: served
        callPatient: false,
        assignDeptTime: new Date(), // assign department time
      },
      include: {
        department: true,
        vitalSigns: true,
        user: {
          select: {
            name: true,
            email: true,
            deptcode: true,
          },
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

const processUpdateTicket = async (job) => {
  try {
    const { id, value, patient, department } = job.data;

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
      const updatedPatient = await prisma.patient.update({
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

      const { relativePath, barcodeBase64 } = await PDFGenerator.generateTicket(
        pdfData
      );

      // Update patient with new department and ticket
      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          ticket: relativePath,
          barcode: barcodeBase64,
        },
      });
    }
  } catch (error) {
    throw error;
  }
};

export const processPatientWorker = new Worker("patient", processPatient, {
  connection,
});

export const processPatientCallWorker = new Worker(
  "patient-call",
  processPatientCall,
  { connection }
);

export const processAssignDepartmentWorker = new Worker(
  "assign-department",
  processAssignDepartment,
  { connection }
);

export const processUpdateTicketWorker = new Worker(
  "update-ticket",
  processUpdateTicket,
  { connection }
);

processPatientWorker.on("completed", (job) => {
  console.log(`Patient Creation job ${job.id} completed successfully`);
});

processPatientWorker.on("failed", (job, err) => {
  console.error(`Patient Creation job ${job.id} failed with error:`, err);
});

processPatientCallWorker.on("completed", (job) => {
  console.log(`Patient Call job ${job.id} completed successfully`);
});

processPatientCallWorker.on("failed", (job, err) => {
  console.error(`Patient Call job ${job.id} failed with error:`, err);
});

processAssignDepartmentWorker.on("completed", (job) => {
  console.log(`Assign Department job ${job.id} completed successfully`);
});

processAssignDepartmentWorker.on("failed", (job, err) => {
  console.error(`Assign Department job ${job.id} failed with error:`, err);
});

processUpdateTicketWorker.on("completed", (job) => {
  console.log(`Update Ticket job ${job.id} completed successfully`);
});

processUpdateTicketWorker.on("failed", (job, err) => {
  console.error(`Update Ticket job ${job.id} failed with error:`, err);
});
