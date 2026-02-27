import { v4 as uuidv4 } from "uuid";
import Question, { IQuestion } from "../models/Question.schema";
import Quiz, { IQuiz } from "../models/Quiz.schema";
import User, { UserRole } from "../models/User.schema";
import QuizAttempt from "../models/QuizAttempt.schema";
import { AppError } from "../middlewares/errorHandler";
import { sendQuizAssignmentEmail } from "../utils/email";
import csv from "csv-parser";
import { Readable } from "stream";

/**
 * Create a new question (US-016)
 */
export const createQuestion = async (
  questionData: Partial<IQuestion>,
  adminId: string
) => {
  const admin = await User.findOne({ userId: adminId });
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  const question = await Question.create({
    ...questionData,
    questionId: uuidv4(),
    createdBy: admin._id,
  });

  return question;
};

/**
 * Update a question (US-017)
 */
export const updateQuestion = async (
  questionId: string,
  updates: Partial<IQuestion>
) => {
  const question = await Question.findOne({ questionId });
  if (!question) {
    throw new AppError("Question not found", 404);
  }

  Object.assign(question, updates);
  await question.save();

  return question;
};

/**
 * Delete a question
 */
export const deleteQuestion = async (questionId: string) => {
  const question = await Question.findOne({ questionId });
  if (!question) {
    throw new AppError("Question not found", 404);
  }

  // Check if question is used in any quiz
  const quizUsingQuestion = await Quiz.findOne({
    questions: question._id,
  });

  if (quizUsingQuestion) {
    // Soft delete - mark as inactive
    question.isActive = false;
    await question.save();
    return {
      message:
        "Question is used in quizzes and has been marked as inactive",
    };
  }

  await Question.deleteOne({ questionId });
  return { message: "Question deleted successfully" };
};

/**
 * Get all questions with filters
 */
export const getQuestions = async (filters: {
  subject?: string;
  grade?: string;
  difficulty?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const {
    subject,
    grade,
    difficulty,
    isActive = true,
    page = 1,
    limit = 20,
  } = filters;

  const query: any = { isActive };

  if (subject) query.subject = subject;
  if (grade) query.grade = grade;
  if (difficulty) query.difficulty = difficulty;

  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * Create a new quiz
 */
export const createQuiz = async (
  quizData: Partial<IQuiz>,
  adminId: string
) => {
  const admin = await User.findOne({ userId: adminId });
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  // Calculate total points from questions
  const questions = await Question.find({
    _id: { $in: quizData.questions },
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const quiz = await Quiz.create({
    ...quizData,
    quizId: uuidv4(),
    totalPoints,
    createdBy: admin._id,
  });

  return quiz;
};

/**
 * Update a quiz
 */
export const updateQuiz = async (
  quizId: string,
  updates: Partial<IQuiz>
) => {
  const quiz = await Quiz.findOne({ quizId });
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  // Recalculate total points if questions changed
  if (updates.questions) {
    const questions = await Question.find({
      _id: { $in: updates.questions },
    });
    updates.totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  }

  Object.assign(quiz, updates);
  await quiz.save();

  return quiz;
};

/**
 * Assign quiz to students (US-020)
 */
export const assignQuiz = async (
  quizId: string,
  studentIds: string[]
) => {
  const quiz = await Quiz.findOne({ quizId });
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  const students = await User.find({
    userId: { $in: studentIds },
    role: UserRole.STUDENT,
  });

  if (students.length === 0) {
    throw new AppError("No valid students found", 404);
  }

  // Add students to assignedTo array (avoid duplicates)
  const currentAssignedIds = quiz.assignedTo.map((id) => id.toString());
  const newStudentIds = students
    .map((s) => s._id)
    .filter((id) => !currentAssignedIds.includes(id.toString()));

  quiz.assignedTo.push(...newStudentIds);
  await quiz.save();

  // Send notification emails
  for (const student of students) {
    if (newStudentIds.some((id) => id.toString() === student._id.toString())) {
      await sendQuizAssignmentEmail(
        student.email,
        student.firstName,
        quiz.title
      );
    }
  }

  return {
    message: `Quiz assigned to ${newStudentIds.length} student(s)`,
    assignedCount: newStudentIds.length,
  };
};

/**
 * Get all quizzes with filters
 */
export const getQuizzes = async (filters: {
  status?: string;
  subject?: string;
  grade?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, subject, grade, page = 1, limit = 20 } = filters;

  const query: any = {};

  if (status) query.status = status;
  if (subject) query.subject = subject;
  if (grade) query.grade = grade;

  const skip = (page - 1) * limit;

  const [quizzes, total] = await Promise.all([
    Quiz.find(query)
      .populate("createdBy", "firstName lastName")
      .select("-questions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Quiz.countDocuments(query),
  ]);

  return {
    quizzes,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * Get quiz results for all students (US-019)
 */
export const getQuizResults = async (quizId: string) => {
  const quiz = await Quiz.findOne({ quizId });
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  const results = await QuizAttempt.find({
    quizId: quiz._id,
    status: "completed",
  })
    .populate("studentId", "firstName lastName email userId")
    .sort({ completedAt: -1 });

  return {
    quiz: {
      title: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      totalPoints: quiz.totalPoints,
    },
    results,
  };
};

/**
 * Get all students
 */
export const getStudents = async (filters: {
  isActive?: boolean;
  grade?: string;
  page?: number;
  limit?: number;
}) => {
  const { isActive = true, grade, page = 1, limit = 20 } = filters;

  const query: any = { role: UserRole.STUDENT, isActive };

  if (grade) query.grade = grade;

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    students,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * Deactivate/Reactivate student account (US-027)
 */
export const toggleStudentStatus = async (
  userId: string,
  isActive: boolean
) => {
  const student = await User.findOne({ userId, role: UserRole.STUDENT });
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  student.isActive = isActive;
  await student.save();

  return {
    message: `Student account ${isActive ? "activated" : "deactivated"} successfully`,
    student: {
      userId: student.userId,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      isActive: student.isActive,
    },
  };
};

/**
 * Import students from CSV (US-028)
 */
export const importStudentsFromCSV = async (csvBuffer: Buffer) => {
  const students: any[] = [];

  return new Promise((resolve, reject) => {
    const stream = Readable.from(csvBuffer.toString());

    stream
      .pipe(csv())
      .on("data", (row) => {
        students.push(row);
      })
      .on("end", async () => {
        const results = {
          success: 0,
          failed: 0,
          errors: [] as any[],
        };

        for (const [index, studentData] of students.entries()) {
          try {
            const { email, firstName, lastName, grade, password } =
              studentData;

            if (!email || !firstName || !lastName || !password) {
              results.failed++;
              results.errors.push({
                row: index + 2,
                email,
                error: "Missing required fields",
              });
              continue;
            }

            // Check if student already exists
            const existing = await User.findOne({ email });
            if (existing) {
              results.failed++;
              results.errors.push({
                row: index + 2,
                email,
                error: "Student already exists",
              });
              continue;
            }

            // Create student
            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash(password, 12);

            await User.create({
              userId: uuidv4(),
              email,
              firstName,
              lastName,
              grade,
              password: hashedPassword,
              role: UserRole.STUDENT,
              isEmailVerified: true, // Auto-verify for bulk import
              isActive: true,
            });

            results.success++;
          } catch (error: any) {
            results.failed++;
            results.errors.push({
              row: index + 2,
              email: studentData.email,
              error: error.message,
            });
          }
        }

        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
