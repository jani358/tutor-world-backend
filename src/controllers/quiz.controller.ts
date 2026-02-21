import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as quizService from "../services/quiz.service";
import { asyncHandler } from "../middlewares/errorHandler";

/**
 * Get all quizzes assigned to student (US-007)
 */
export const getMyQuizzes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const quizzes = await quizService.getStudentQuizzes(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: quizzes,
    });
  }
);

/**
 * Start a quiz (US-004)
 */
export const startQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;

    const result = await quizService.startQuiz(quizId, req.user!.userId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  }
);

/**
 * Submit quiz answers (US-006, US-010, US-011)
 */
export const submitQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { attemptId } = req.params;
    const { answers } = req.body;

    const result = await quizService.submitQuiz(
      attemptId,
      req.user!.userId,
      answers
    );

    res.status(200).json({
      status: "success",
      message: "Quiz submitted successfully",
      data: result,
    });
  }
);

/**
 * Get quiz result (US-010, US-011, US-012)
 */
export const getResult = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { attemptId } = req.params;

    const result = await quizService.getQuizResult(
      attemptId,
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  }
);

/**
 * Get all quiz attempts (US-013)
 */
export const getMyAttempts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attempts = await quizService.getStudentAttempts(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: attempts,
    });
  }
);
