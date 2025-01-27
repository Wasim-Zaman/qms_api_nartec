import { Queue } from "bullmq";
import dotenv from "dotenv";
import IORedis from "ioredis";

dotenv.config();

export const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

// Patient Queue
export const patientQueue = new Queue("patient", {
  connection,
  defaultJobOptions,
});

export const patientCallQueue = new Queue("patient-call", {
  connection,
  defaultJobOptions,
});

export const assignDepartmentQueue = new Queue("assign-department", {
  connection,
  defaultJobOptions,
});

export const updateTicketQueue = new Queue("update-ticket", {
  connection,
  defaultJobOptions,
});
