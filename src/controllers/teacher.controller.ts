import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as teacherService from "../services/teacher.service";
import * as adminService from "../services/admin.service";
import { asyncHandler } from "../middlewares/errorHandler";

// ─── Dashboard ───

export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const stats = await teacherService.getDashboardStats(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  }
);

// ─── Questions (uses admin service with ownership) ───

export const getQuestions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      subject: req.query.subject as string,
      grade: req.query.grade as string,
      difficulty: req.query.difficulty as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await teacherService.getTeacherQuestions(
      req.user!.userId,
      filters
    );

    res.status(200).json({
      status: "success",
      data: result.questions,
      pagination: result.pagination,
    });
  }
);

export const createQuestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const question = await adminService.createQuestion(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      status: "success",
      message: "Question created successfully",
      data: question,
    });
  }
);

export const updateQuestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;
    const question = await adminService.updateQuestion(
      questionId,
      req.body,
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      message: "Question updated successfully",
      data: question,
    });
  }
);

export const deleteQuestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;
    const result = await adminService.deleteQuestion(
      questionId,
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

// ─── Quizzes ───

export const getQuizzes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await teacherService.getTeacherQuizzes(
      req.user!.userId,
      filters
    );

    res.status(200).json({
      status: "success",
      data: result.quizzes,
      pagination: result.pagination,
    });
  }
);

export const createQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const quiz = await adminService.createQuiz(req.body, req.user!.userId);

    res.status(201).json({
      status: "success",
      message: "Quiz created successfully",
      data: quiz,
    });
  }
);

export const updateQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;
    const quiz = await adminService.updateQuiz(
      quizId,
      req.body,
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      message: "Quiz updated successfully",
      data: quiz,
    });
  }
);

export const deleteQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;
    const result = await adminService.deleteQuiz(quizId, req.user!.userId);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

export const assignQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;
    const { studentIds } = req.body;

    const result = await adminService.assignQuiz(quizId, studentIds);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: { assignedCount: result.assignedCount },
    });
  }
);

export const getQuizResults = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;
    const result = await adminService.getQuizResults(quizId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  }
);

// ─── Students ───

export const getStudents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await teacherService.getTeacherStudents(
      req.user!.userId,
      filters
    );

    res.status(200).json({
      status: "success",
      data: result.students,
      pagination: result.pagination,
    });
  }
);

// ─── Results ───

export const getResults = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await teacherService.getTeacherResults(
      req.user!.userId,
      filters
    );

    res.status(200).json({
      status: "success",
      data: result.results,
      pagination: result.pagination,
    });
  }
);
