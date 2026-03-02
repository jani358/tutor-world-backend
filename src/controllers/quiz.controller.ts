import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as quizService from "../services/quiz.service";
import { asyncHandler } from "../middlewares/errorHandler";

export const getMyQuizzes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const quizzes = await quizService.getStudentQuizzes(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: quizzes,
    });
  }
);

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

export const getMyAttempts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const attempts = await quizService.getStudentAttempts(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: attempts,
    });
  }
);
