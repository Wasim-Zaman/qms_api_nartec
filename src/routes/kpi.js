import express from "express";
import KPIController from "../controllers/kpi.js";
import { verifyAccessToken } from "../middlewares/auth.js";
const router = express.Router();

router.use(verifyAccessToken);

router.get("/patient-counts", KPIController.getPatientCounts);

router.get("/registration-trend", KPIController.getPatientRegistrationTrend);

router.get("/eyeball-to-triage", KPIController.getEyeballToTriageTime);

router.get("/hourly-flow", KPIController.getHourlyPatientFlow);
router.get("/department-performance", KPIController.getDepartmentPerformance);
router.get("/waiting-times", KPIController.getPatientWaitingTimes);

export default router;
