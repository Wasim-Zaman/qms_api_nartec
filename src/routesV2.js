import express from "express";

import patientRoutes from "./routes/v2/patient.js";

const router = express.Router();

router.use("/patients", patientRoutes);

export default router;
