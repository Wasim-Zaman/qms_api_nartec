import express from "express";

import departmentRoutes from "./routes/department.js";
import patientRoutes from "./routes/patient.js";
import userRoutes from "./routes/user.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/patients", patientRoutes);
router.use("/departments", departmentRoutes);

export default router;
