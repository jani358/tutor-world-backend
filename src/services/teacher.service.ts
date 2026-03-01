import Question from "../models/Question.schema";
import Quiz from "../models/Quiz.schema";
import QuizAttempt from "../models/QuizAttempt.schema";
import User from "../models/User.schema";
import { AppError } from "../middlewares/errorHandler";

export const getDashboardStats = async (userId: string) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const [questionsCreated, quizzesCreated] = await Promise.all([
    Question.countDocuments({ createdBy: teacher._id, isActive: true }),
    Quiz.countDocuments({ createdBy: teacher._id, isDeleted: { $ne: true } }),
  ]);

  const teacherQuizzes = await Quiz.find({
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  }).select("assignedTo");

  const uniqueStudentIds = new Set<string>();
  teacherQuizzes.forEach((q) => {
    q.assignedTo.forEach((id) => uniqueStudentIds.add(id.toString()));
  });

  const activeStudents = await User.countDocuments({
    _id: { $in: [...uniqueStudentIds] },
    isActive: true,
    isDeleted: { $ne: true },
  });

  const quizIds = teacherQuizzes.map((q) => q._id);

  const totalSubmissions = await QuizAttempt.countDocuments({
    quizId: { $in: quizIds },
    status: "completed",
  });

  const scoreAgg = await QuizAttempt.aggregate([
    { $match: { quizId: { $in: quizIds }, status: "completed" } },
    { $group: { _id: null, avg: { $avg: "$percentage" } } },
  ]);

  return {
    questionsCreated,
    quizzesCreated,
    activeStudents,
    totalSubmissions,
    averageScore: Math.round(scoreAgg[0]?.avg || 0),
  };
};

export const getTeacherQuestions = async (
  userId: string,
  filters: {
    subject?: string;
    grade?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const { subject, grade, difficulty, page = 1, limit = 20 } = filters;

  const query: any = { createdBy: teacher._id, isActive: true };
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
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};

export const getTeacherStudents = async (
  userId: string,
  filters: { isActive?: boolean; page?: number; limit?: number }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const teacherQuizzes = await Quiz.find({
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  }).select("assignedTo");

  const uniqueStudentIds = new Set<string>();
  teacherQuizzes.forEach((q) => {
    q.assignedTo.forEach((id) => uniqueStudentIds.add(id.toString()));
  });

  const { isActive, page = 1, limit = 20 } = filters;
  const query: any = {
    _id: { $in: [...uniqueStudentIds] },
    isDeleted: { $ne: true },
  };
  if (typeof isActive === "boolean") query.isActive = isActive;

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
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};

export const getTeacherResults = async (
  userId: string,
  filters: { page?: number; limit?: number }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const teacherQuizzes = await Quiz.find({
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  }).select("_id");

  const quizIds = teacherQuizzes.map((q) => q._id);
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    QuizAttempt.find({
      quizId: { $in: quizIds },
      status: "completed",
    })
      .populate("quizId", "title subject grade")
      .populate("studentId", "firstName lastName email userId")
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit),
    QuizAttempt.countDocuments({
      quizId: { $in: quizIds },
      status: "completed",
    }),
  ]);

  return {
    results,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};

export const getTeacherQuizzes = async (
  userId: string,
  filters: { status?: string; page?: number; limit?: number }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const { status, page = 1, limit = 20 } = filters;
  const query: any = {
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  };
  if (status) query.status = status;

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
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};
