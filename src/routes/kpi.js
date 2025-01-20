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

export default router;
