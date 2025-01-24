import express from "express";

import departmentRoutes from "./routes/department.js";
import kpiRoutes from "./routes/kpi.js";
import patientRoutes from "./routes/patient.js";
import roleRoutes from "./routes/role.js";
import userRoutes from "./routes/user.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/patients", patientRoutes);
router.use("/departments", departmentRoutes);
router.use("/kpi", kpiRoutes);
router.use("/roles", roleRoutes);

export default router;
