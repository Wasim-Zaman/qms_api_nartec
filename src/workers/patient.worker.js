import { Worker } from "bullmq";

import { connection } from "../config/queue.js";
import { addDomain, ensureRequiredDirs } from "../utils/file.js";
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

const worker = new Worker("patient", processPatient, { connection });

worker.on("completed", (job) => {
  console.log(`Patient Creation job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Patient Creation job ${job.id} failed with error:`, err);
});

export default worker;
