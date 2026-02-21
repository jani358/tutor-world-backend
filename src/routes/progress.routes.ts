import { Router } from "express";
import * as progressController from "../controllers/progress.controller";
import { authenticate, isStudent } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(isStudent);

/**
 * @route   GET /api/progress
 * @desc    Get student progress overview (US-009, US-013)
 * @access  Private (Student)
 */
router.get("/", progressController.getProgress);

/**
 * @route   GET /api/progress/statistics
 * @desc    Get detailed statistics (US-014)
 * @access  Private (Student)
 */
router.get("/statistics", progressController.getStatistics);

/**
 * @route   GET /api/progress/chart
 * @desc    Get progress chart data with filters (US-013, US-015)
 * @access  Private (Student)
 */
router.get("/chart", progressController.getChart);

export default router;
