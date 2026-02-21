import { Router } from "express";
import multer from "multer";
import * as adminController from "../controllers/admin.controller";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Configure multer for CSV upload
const upload = multer({ storage: multer.memoryStorage() });

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * Question Management Routes
 */

// Create question (US-016)
router.post("/questions", adminController.createQuestion);

// Get all questions
router.get("/questions", adminController.getQuestions);

// Update question (US-017)
router.put("/questions/:questionId", adminController.updateQuestion);

// Delete question
router.delete("/questions/:questionId", adminController.deleteQuestion);

/**
 * Quiz Management Routes
 */

// Create quiz
router.post("/quizzes", adminController.createQuiz);

// Get all quizzes
router.get("/quizzes", adminController.getQuizzes);

// Update quiz
router.put("/quizzes/:quizId", adminController.updateQuiz);

// Assign quiz to students (US-020)
router.post("/quizzes/:quizId/assign", adminController.assignQuiz);

// Get quiz results (US-019)
router.get("/quizzes/:quizId/results", adminController.getQuizResults);

/**
 * Student Management Routes
 */

// Get all students
router.get("/students", adminController.getStudents);

// Toggle student status (US-027)
router.patch("/students/:userId/toggle-status", adminController.toggleStudentStatus);

// Import students from CSV (US-028)
router.post(
  "/students/import",
  upload.single("file"),
  adminController.importStudents
);

export default router;
