import { Router } from "express";
import * as quizController from "../controllers/quiz.controller";
import { authenticate, isStudent } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(isStudent);

/**
 * @route   GET /api/quizzes/my-quizzes
 * @desc    Get all assigned quizzes (US-007)
 * @access  Private (Student)
 */
router.get("/my-quizzes", quizController.getMyQuizzes);

/**
 * @route   GET /api/quizzes/:quizId/start
 * @desc    Start a quiz (US-004)
 * @access  Private (Student)
 */
router.get("/:quizId/start", quizController.startQuiz);

/**
 * @route   POST /api/quizzes/:attemptId/submit
 * @desc    Submit quiz answers (US-006, US-010, US-011)
 * @access  Private (Student)
 */
router.post("/:attemptId/submit", quizController.submitQuiz);

/**
 * @route   GET /api/quizzes/results/:attemptId
 * @desc    Get quiz result (US-010, US-011, US-012)
 * @access  Private (Student)
 */
router.get("/results/:attemptId", quizController.getResult);

/**
 * @route   GET /api/quizzes/my-attempts
 * @desc    Get all quiz attempts (US-013)
 * @access  Private (Student)
 */
router.get("/my-attempts", quizController.getMyAttempts);

export default router;
