import { Worker } from "bullmq";

import { connection } from "../config/queue.js";
import socketService from "../services/socket.js";
import { addDomain, ensureRequiredDirs } from "../utils/file.js";
import MyError from "../utils/myError.js";
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

export const processPatientWorker = new Worker("patient", processPatient, {
  connection,
});
export const processPatientCallWorker = new Worker(
  "patient-call",
  processPatientCall,
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
