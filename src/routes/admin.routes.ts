import { Router } from "express";
import multer from "multer";
import * as adminController from "../controllers/admin.controller";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import * as adminValidation from "../validations/admin.validation";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// ─── Dashboard ───
router.get("/dashboard-stats", adminController.getDashboardStats);

// ─── Questions ───
router.post("/questions", validate(adminValidation.createQuestionSchema), adminController.createQuestion);
router.get("/questions", adminController.getQuestions);
router.put("/questions/:questionId", validate(adminValidation.updateQuestionSchema), adminController.updateQuestion);
router.delete("/questions/:questionId", adminController.deleteQuestion);

// ─── Quizzes ───
router.post("/quizzes", validate(adminValidation.createQuizSchema), adminController.createQuiz);
router.get("/quizzes", adminController.getQuizzes);
router.put("/quizzes/:quizId", validate(adminValidation.updateQuizSchema), adminController.updateQuiz);
router.delete("/quizzes/:quizId", adminController.deleteQuiz);
router.post("/quizzes/:quizId/assign", validate(adminValidation.assignQuizSchema), adminController.assignQuiz);
router.get("/quizzes/:quizId/results", adminController.getQuizResults);

// ─── Students ───
router.get("/students", adminController.getStudents);
router.patch("/students/:userId/toggle-status", adminController.toggleStudentStatus);
router.delete("/students/:userId", adminController.deleteStudent);
router.post("/students/import", upload.single("file"), adminController.importStudents);

// ─── Teachers ───
router.get("/teachers", adminController.getTeachers);
router.patch("/teachers/:userId/toggle-status", adminController.toggleTeacherStatus);
router.delete("/teachers/:userId", adminController.deleteTeacher);

// ─── Audit Logs ───
router.get("/audit-logs", adminController.getAuditLogs);

export default router;
