import { Router } from "express";
import multer from "multer";
import * as adminController from "../controllers/admin.controller";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import * as adminValidation from "../validations/admin.validation";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(isAdmin);

router.get("/dashboard-stats", adminController.getDashboardStats);

router.post("/questions", validate(adminValidation.createQuestionSchema), adminController.createQuestion);
router.get("/questions", adminController.getQuestions);
router.put("/questions/:questionId", validate(adminValidation.updateQuestionSchema), adminController.updateQuestion);
router.delete("/questions/:questionId", adminController.deleteQuestion);

router.post("/quizzes", validate(adminValidation.createQuizSchema), adminController.createQuiz);
router.get("/quizzes", adminController.getQuizzes);
router.put("/quizzes/:quizId", validate(adminValidation.updateQuizSchema), adminController.updateQuiz);
router.delete("/quizzes/:quizId", adminController.deleteQuiz);
router.post("/quizzes/:quizId/assign", validate(adminValidation.assignQuizSchema), adminController.assignQuiz);
router.get("/quizzes/:quizId/results", adminController.getQuizResults);
router.get("/results", adminController.getAllResults);

router.get("/students", adminController.getStudents);
router.patch("/students/:userId/toggle-status", adminController.toggleStudentStatus);
router.delete("/students/:userId", adminController.deleteStudent);
router.post("/students/import", upload.single("file"), adminController.importStudents);

router.get("/teachers", adminController.getTeachers);
router.patch("/teachers/:userId/toggle-status", adminController.toggleTeacherStatus);
router.delete("/teachers/:userId", adminController.deleteTeacher);

router.get("/audit-logs", adminController.getAuditLogs);

router.get("/classes", adminController.getClasses);
router.post("/classes", validate(adminValidation.createClassSchema), adminController.createClass);
router.put("/classes/:classId", validate(adminValidation.updateClassSchema), adminController.updateClass);
router.delete("/classes/:classId", adminController.deleteClass);
router.patch("/classes/:classId/toggle-status", adminController.toggleClassStatus);
router.patch("/classes/:classId/assign-teacher", validate(adminValidation.assignTeacherSchema), adminController.assignTeacherToClass);
router.patch("/students/:userId/assign-class", validate(adminValidation.assignStudentClassSchema), adminController.assignStudentToClass);

router.get("/subjects", adminController.getSubjects);
router.post("/subjects", validate(adminValidation.createSubjectSchema), adminController.createSubject);
router.patch("/subjects/:subjectId/toggle-status", adminController.toggleSubjectStatus);
router.delete("/subjects/:subjectId", adminController.deleteSubject);

router.get("/notifications", adminController.getNotifications);
router.post("/notifications", validate(adminValidation.createNotificationSchema), adminController.createNotification);
router.delete("/notifications/:notificationId", adminController.deleteNotification);
router.patch("/notifications/:notificationId/read", adminController.markNotificationRead);

export default router;
