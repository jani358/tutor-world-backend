import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as adminService from "../services/admin.service";
import { asyncHandler } from "../middlewares/errorHandler";

/**
 * Question Management
 */

// Create question (US-016)
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

// Update question (US-017)
export const updateQuestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;

    const question = await adminService.updateQuestion(questionId, req.body);

    res.status(200).json({
      status: "success",
      message: "Question updated successfully",
      data: question,
    });
  }
);

// Delete question
export const deleteQuestion = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;

    const result = await adminService.deleteQuestion(questionId);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

// Get all questions
export const getQuestions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      subject: req.query.subject as string,
      grade: req.query.grade as string,
      difficulty: req.query.difficulty as string,
      isActive:
        req.query.isActive === "false" ? false : true,
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

/**
 * Quiz Management
 */

// Create quiz
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

// Update quiz
export const updateQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;

    const quiz = await adminService.updateQuiz(quizId, req.body);

    res.status(200).json({
      status: "success",
      message: "Quiz updated successfully",
      data: quiz,
    });
  }
);

// Assign quiz to students (US-020)
export const assignQuiz = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { quizId } = req.params;
    const { studentIds } = req.body;

    const result = await adminService.assignQuiz(quizId, studentIds);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: {
        assignedCount: result.assignedCount,
      },
    });
  }
);

// Get all quizzes
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

// Get quiz results (US-019)
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

/**
 * Student Management
 */

// Get all students
export const getStudents = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters = {
      isActive:
        req.query.isActive === "false" ? false : true,
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

// Deactivate/Reactivate student (US-027)
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

// Import students from CSV (US-028)
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
