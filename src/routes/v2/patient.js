import express from "express";
import PatientController from "../../controllers/v2/patient.js";
import { verifyAccessToken } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/by-department", PatientController.getPatientsByDepartment);
router.get("/search", PatientController.searchPatients);
router.get("/journey-time/:id", PatientController.getPatientJourneyTime);
router.get("/journeys", PatientController.getPatientJourneys);
router.post("/", verifyAccessToken, PatientController.createPatient);

router.post(
  "/:id/vital-sign",
  verifyAccessToken,
  PatientController.createVitalSign
);
router.patch("/:id/toggle-call", PatientController.togglePatientCall);
router.patch("/:id/void", verifyAccessToken, PatientController.voidPatient);
router.patch(
  "/:id/assign-department",
  verifyAccessToken,
  PatientController.assignDepartment
);

router.patch(
  "/:id/begin-time",
  verifyAccessToken,
  PatientController.setBeginTime
);
router.patch("/:id/end-time", verifyAccessToken, PatientController.setEndTime);
router.patch(
  "/:id/discharge",
  verifyAccessToken,
  PatientController.dischargePatient
);

router.post(
  "/re-register/:id",
  verifyAccessToken,
  PatientController.reRegisterPatient
);

export default router;
