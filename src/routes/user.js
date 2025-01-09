import express from "express";
import controller from "../controllers/user.js";
import { verifyRefreshToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", controller.login);
router.post("/refresh-token", verifyRefreshToken, controller.refreshToken);

export default router;
