import express from "express";
import JourneyController from "../controllers/journey.js";
// import { verifyAccessToken } from "../middlewares/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(verifyAccessToken);

// Get active journeys created or updated today
router.get("/active", JourneyController.getActiveJourneys);

// Get previous journeys (excluding those created or updated today)
router.get("/previous", JourneyController.getPreviousJourneys);

// Export all journeys to Excel
router.get("/export", JourneyController.exportJourneysToExcel);

// Get journeys by patient ID
router.get("/patient/:patientId", JourneyController.getJourneysByPatientId);

export default router;
