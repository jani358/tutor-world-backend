import { Router } from "express";
import * as quizController from "../controllers/quiz.controller";
import { authenticate, isStudent } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(isStudent);

router.get("/my-quizzes", quizController.getMyQuizzes);

router.get("/:quizId/start", quizController.startQuiz);

router.post("/:attemptId/submit", quizController.submitQuiz);

router.get("/results/:attemptId", quizController.getResult);

router.get("/my-attempts", quizController.getMyAttempts);

export default router;
