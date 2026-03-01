import { Router } from "express";
import * as teacherController from "../controllers/teacher.controller";
import { authenticate, isAdminOrTeacher } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import * as adminValidation from "../validations/admin.validation";

const router = Router();

// All routes require teacher or admin authentication
router.use(authenticate);
router.use(isAdminOrTeacher);

// ─── Dashboard ───
router.get("/dashboard-stats", teacherController.getDashboardStats);

// ─── Questions ───
router.get("/questions", teacherController.getQuestions);
router.post("/questions", validate(adminValidation.createQuestionSchema), teacherController.createQuestion);
router.put("/questions/:questionId", validate(adminValidation.updateQuestionSchema), teacherController.updateQuestion);
router.delete("/questions/:questionId", teacherController.deleteQuestion);

// ─── Quizzes ───
router.get("/quizzes", teacherController.getQuizzes);
router.post("/quizzes", validate(adminValidation.createQuizSchema), teacherController.createQuiz);
router.put("/quizzes/:quizId", validate(adminValidation.updateQuizSchema), teacherController.updateQuiz);
router.delete("/quizzes/:quizId", teacherController.deleteQuiz);
router.post("/quizzes/:quizId/assign", validate(adminValidation.assignQuizSchema), teacherController.assignQuiz);
router.get("/quizzes/:quizId/results", teacherController.getQuizResults);

// ─── Students ───
router.get("/students", teacherController.getStudents);

// ─── Results ───
router.get("/results", teacherController.getResults);

export default router;
