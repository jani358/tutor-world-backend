import { v4 as uuidv4 } from "uuid";
import Question from "../models/Question.schema";
import Quiz from "../models/Quiz.schema";
import QuizAttempt from "../models/QuizAttempt.schema";
import User, { UserRole } from "../models/User.schema";
import Class from "../models/Class.schema";
import StudentGroup from "../models/StudentGroup.schema";
import { AppError } from "../middlewares/errorHandler";

export const getDashboardStats = async (userId: string) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  // Get teacher's assigned class
  const assignedClass = await Class.findOne({
    teacher: teacher._id,
    isDeleted: { $ne: true },
  }).select("name students");

  const [questionsCreated, quizzesCreated] = await Promise.all([
    Question.countDocuments({ createdBy: teacher._id, isActive: true }),
    Quiz.countDocuments({ createdBy: teacher._id, isDeleted: { $ne: true } }),
  ]);

  // Count active students from the assigned class
  const classStudentIds = assignedClass?.students ?? [];
  const activeStudents = classStudentIds.length > 0
    ? await User.countDocuments({
        _id: { $in: classStudentIds },
        role: UserRole.STUDENT,
        isActive: true,
        isDeleted: { $ne: true },
      })
    : 0;

  const teacherQuizzes = await Quiz.find({
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  }).select("_id");

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
    className: assignedClass?.name ?? null,
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

  // Get teacher's assigned class with populated students
  const assignedClass = await Class.findOne({
    teacher: teacher._id,
    isDeleted: { $ne: true },
  }).select("name students");

  if (!assignedClass || assignedClass.students.length === 0) {
    return {
      students: [],
      pagination: { total: 0, page: 1, pages: 0, limit: filters.limit || 20 },
    };
  }

  const { isActive, page = 1, limit = 20 } = filters;
  const query: any = {
    _id: { $in: assignedClass.students },
    role: UserRole.STUDENT,
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

  // Batch fetch quiz stats for all students (avoids N+1)
  const studentIds = students.map((s) => s._id);
  const statsAgg = await QuizAttempt.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$studentId",
        quizzesCompleted: { $sum: 1 },
        averageScore: { $avg: "$percentage" },
      },
    },
  ]);

  const statsMap: Record<string, { quizzesCompleted: number; averageScore: number }> = {};
  for (const stat of statsAgg) {
    statsMap[stat._id.toString()] = {
      quizzesCompleted: stat.quizzesCompleted,
      averageScore: Math.round(stat.averageScore || 0),
    };
  }

  // Enrich each student with className, teacherName, and quiz stats
  const enriched = students.map((s) => {
    const stats = statsMap[s._id.toString()] || { quizzesCompleted: 0, averageScore: 0 };
    return {
      ...s.toObject(),
      className: assignedClass.name,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      quizzesCompleted: stats.quizzesCompleted,
      averageScore: stats.averageScore,
    };
  });

  return {
    students: enriched,
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

export const getAttemptResult = async (
  userId: string,
  attemptId: string
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  // First find the attempt to verify ownership
  const attempt = await QuizAttempt.findOne({ attemptId });
  if (!attempt) {
    throw new AppError("Result not found", 404);
  }

  // Verify the quiz belongs to this teacher
  const quiz = await Quiz.findById(attempt.quizId).select("createdBy");
  if (!quiz || quiz.createdBy.toString() !== teacher._id.toString()) {
    throw new AppError("Unauthorized", 403);
  }

  // Now populate the full result separately to avoid populate conflicts
  const result = await QuizAttempt.findById(attempt._id)
    .populate({
      path: "quizId",
      select: "title description subject grade passingScore totalPoints",
    })
    .populate({
      path: "answers.questionId",
      select:
        "title description questionType options correctAnswer explanation imageUrl points",
    })
    .populate("studentId", "firstName lastName email userId");

  return result;
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

export const createStudentGroup = async (
  userId: string,
  data: { name: string; description?: string; studentIds?: string[]; color?: string }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  let studentObjectIds: import("mongoose").Types.ObjectId[] = [];
  if (data.studentIds && data.studentIds.length > 0) {
    const students = await User.find({
      userId: { $in: data.studentIds },
      role: UserRole.STUDENT,
      isDeleted: { $ne: true },
    }).select("_id");
    studentObjectIds = students.map((s) => s._id);
  }

  const group = await StudentGroup.create({
    groupId: uuidv4(),
    name: data.name,
    description: data.description || "",
    students: studentObjectIds,
    createdBy: teacher._id,
    color: data.color || "primary",
  });

  return StudentGroup.findById(group._id).populate({
    path: "students",
    select: "userId firstName lastName email username isActive",
    match: { isDeleted: { $ne: true } },
  });
};

export const getTeacherGroups = async (userId: string) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const groups = await StudentGroup.find({
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  })
    .populate({
      path: "students",
      select: "userId firstName lastName email username isActive",
      match: { isDeleted: { $ne: true } },
    })
    .sort({ createdAt: -1 });

  return groups;
};

export const updateStudentGroup = async (
  userId: string,
  groupId: string,
  data: { name?: string; description?: string; studentIds?: string[]; color?: string }
) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const group = await StudentGroup.findOne({
    groupId,
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  });
  if (!group) throw new AppError("Group not found", 404);

  if (data.name !== undefined) group.name = data.name;
  if (data.description !== undefined) group.description = data.description;
  if (data.color !== undefined) group.color = data.color as any;

  if (data.studentIds !== undefined) {
    const students = await User.find({
      userId: { $in: data.studentIds },
      role: UserRole.STUDENT,
      isDeleted: { $ne: true },
    }).select("_id");
    group.students = students.map((s) => s._id);
  }

  await group.save();

  return StudentGroup.findById(group._id).populate({
    path: "students",
    select: "userId firstName lastName email username isActive",
    match: { isDeleted: { $ne: true } },
  });
};

export const deleteStudentGroup = async (userId: string, groupId: string) => {
  const teacher = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const group = await StudentGroup.findOne({
    groupId,
    createdBy: teacher._id,
    isDeleted: { $ne: true },
  });
  if (!group) throw new AppError("Group not found", 404);

  group.isDeleted = true;
  group.deletedAt = new Date();
  await group.save();

  return { message: "Group deleted successfully" };
};
