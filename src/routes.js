import express from "express";

import userRoutes from "./routes/user.js";

const router = express.Router();

router.use("/user", userRoutes);

export default router;
