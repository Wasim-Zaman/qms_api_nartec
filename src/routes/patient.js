import express from "express";
import PatientController from "../controllers/patient.js";
import { verifyAccessToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyAccessToken);

router.get("/by-state", PatientController.getPatientsByState);
router.get("/called", PatientController.getCalledPatients);
router.post("/", PatientController.createPatient);
router.get("/", PatientController.getAllPatients);
router.get("/:id", PatientController.getPatientById);
router.put("/:id", PatientController.updatePatient);
router.delete("/:id", PatientController.deletePatient);

router.post("/:id/vital-sign", PatientController.createVitalSign);
router.patch("/:id/toggle-call", PatientController.togglePatientCall);

export default router;
