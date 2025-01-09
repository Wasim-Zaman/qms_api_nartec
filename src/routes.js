import express from "express";

import patientRoutes from "./routes/patient.js";
import userRoutes from "./routes/user.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/patients", patientRoutes);

export default router;
