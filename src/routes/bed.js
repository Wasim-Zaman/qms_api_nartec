import express from "express";
import BedController from "../controllers/bed.js";
import { verifyAccessToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", verifyAccessToken, BedController.createBed);
router.get("/", BedController.getAllBeds);
router.get("/all", BedController.getAllBedsNoPagination);
router.get("/:id", BedController.getBedById);
router.put("/:id", verifyAccessToken, BedController.updateBed);
router.delete("/:id", verifyAccessToken, BedController.deleteBed);

export default router;
