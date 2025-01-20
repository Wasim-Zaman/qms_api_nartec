import express from "express";
import KPIController from "../controllers/kpi.js";

const router = express.Router();

router.get(
  "/patient-counts",
  //   verifyAccessToken,
  KPIController.getPatientCounts
);

router.get(
  "/registration-trend",
  //   verifyAccessToken,
  KPIController.getPatientRegistrationTrend
);

router.get(
  "/eyeball-to-triage",
  //   verifyAccessToken,  // Uncomment if you want to require authentication
  KPIController.getEyeballToTriageTime
);

export default router;
