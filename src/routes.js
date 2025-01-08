import express from "express";

import superadminRoutes from "./routes/superadmin.js";

const router = express.Router();

router.use("/admin", superadminRoutes);

export default router;
