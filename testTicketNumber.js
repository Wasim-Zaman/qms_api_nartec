// test-patient-query.js
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Replace with an actual department ID from your database
const DEPARTMENT_ID = 29; // Change this to a real department ID

async function testQueries() {
  try {
    console.log("Starting query tests...");

    // Basic info about data
    const totalPatients = await prisma.patient.count();
    console.log(`Total patients in database: ${totalPatients}`);

    // Test 1: Original query
    const originalQuery = await prisma.patient.count({
      where: {
        departmentId: DEPARTMENT_ID,
        registrationDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        OR: [
          {
            state: {
              in: [0, 1],
            },
          },
        ],
      },
    });
    console.log(`Original query result: ${originalQuery}`);

    // Test 2: Fixed query with proper structure
    const fixedQuery = await prisma.patient.count({
      where: {
        departmentId: DEPARTMENT_ID,
        registrationDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
        state: {
          in: [0, 1, 2, 3],
        },
      },
    });
    console.log(`Fixed query result: ${fixedQuery}`);

    // check if there is already a patient with the same ticket number
    const existingPatientWithSameTicket = await prisma.patient.findMany({
      where: {
        ticketNumber: {
          gte: fixedQuery,
        },
        departmentId: DEPARTMENT_ID,
        registrationDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
      },
      orderBy: {
        registrationDate: "desc",
      },
      select: {
        id: true,
        ticketNumber: true,
        registrationDate: true,
      },
      take: 1,
    });

    console.log("existingPatientWithSameTicket", existingPatientWithSameTicket);

    // Test 3: Using createdAt instead of registrationDate
    const createdAtQuery = await prisma.patient.count({
      where: {
        departmentId: DEPARTMENT_ID,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
        state: {
          in: [0, 1],
        },
      },
    });
    console.log(`Using createdAt result: ${createdAtQuery}`);

    // Test 4: Only filter by department and state
    const departmentStateQuery = await prisma.patient.count({
      where: {
        departmentId: DEPARTMENT_ID,
        state: {
          in: [0, 1],
        },
      },
    });
    console.log(`Department + state only: ${departmentStateQuery}`);

    // Test 5: Only filter by date
    const dateOnlyQuery = await prisma.patient.count({
      where: {
        registrationDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
      },
    });
    console.log(`Date filter only: ${dateOnlyQuery}`);

    // Get some sample patients for debugging
    const samplePatients = await prisma.patient.findMany({
      where: {
        departmentId: DEPARTMENT_ID,
      },
      select: {
        id: true,
        registrationDate: true,
        createdAt: true,
        state: true,
      },
      take: 5,
    });
    console.log("Sample patients for debugging:");
    console.log(JSON.stringify(samplePatients, null, 2));
  } catch (error) {
    console.error("Error running test queries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries().then(() => console.log("Query testing complete!"));
