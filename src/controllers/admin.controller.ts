import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as adminService from "../services/admin.service";
import { asyncHandler } from "../middlewares/errorHandler";
import { getAuditLogs as fetchAuditLogs } from "../utils/auditLogger";

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

export const getQuestions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      subject: req.query.subject as string,
      grade: req.query.grade as string,
      difficulty: req.query.difficulty as string,
      isActive: req.query.isActive === "false" ? false : true,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await adminService.getQuestions(filters);

    res.status(200).json({
      status: "success",
      data: result.questions,
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

export const getQuizzes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      status: req.query.status as string,
      subject: req.query.subject as string,
      grade: req.query.grade as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await adminService.getQuizzes(filters);

    res.status(200).json({
      status: "success",
      data: result.quizzes,
      pagination: result.pagination,
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

export const getStudents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      grade: req.query.grade as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await adminService.getStudents(filters);

    res.status(200).json({
      status: "success",
      data: result.students,
      pagination: result.pagination,
    });
  }
);

export const toggleStudentStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    const result = await adminService.toggleStudentStatus(userId, isActive);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result.student,
    });
  }
);

export const deleteStudent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const result = await adminService.deleteStudent(userId);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

export const importStudents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "Please upload a CSV file",
      });
      return;
    }

    const result = await adminService.importStudentsFromCSV(req.file.buffer);

    res.status(200).json({
      status: "success",
      message: "Students imported",
      data: result,
    });
  }
);

export const getTeachers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await adminService.getTeachers(filters);

    res.status(200).json({
      status: "success",
      data: result.teachers,
      pagination: result.pagination,
    });
  }
);

export const toggleTeacherStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    const result = await adminService.toggleTeacherStatus(userId, isActive);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result.teacher,
    });
  }
);

export const deleteTeacher = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const result = await adminService.deleteTeacher(userId);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

export const getDashboardStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const stats = await adminService.getDashboardStats();

    res.status(200).json({
      status: "success",
      data: stats,
    });
  }
);

export const getAuditLogs = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      action: req.query.action as string,
      targetType: req.query.targetType as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await fetchAuditLogs(filters);

    res.status(200).json({
      status: "success",
      data: result.logs,
      pagination: result.pagination,
    });
  }
);
