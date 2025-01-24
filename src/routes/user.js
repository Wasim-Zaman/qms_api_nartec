import express from "express";
import UserController from "../controllers/user.js";
import { verifyAccessToken, verifyRefreshToken } from "../middlewares/auth.js";

const router = express.Router();

// Auth routes (these should be first as they don't need token verification)
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/refresh-token", verifyRefreshToken, UserController.refreshToken);

// Protected user management routes
router.post("/", verifyAccessToken, UserController.createUser);
router.get("/", verifyAccessToken, UserController.getAllUsers);
router.get("/:id", verifyAccessToken, UserController.getUserById);
router.put("/:id", verifyAccessToken, UserController.updateUser);
router.delete("/:id", verifyAccessToken, UserController.deleteUser);

export default router;
