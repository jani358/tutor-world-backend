import { v4 as uuidv4 } from "uuid";
import Question, { IQuestion } from "../models/Question.schema";
import Quiz, { IQuiz } from "../models/Quiz.schema";
import User, { UserRole } from "../models/User.schema";
import QuizAttempt from "../models/QuizAttempt.schema";
import { AppError } from "../middlewares/errorHandler";
import { sendQuizAssignmentEmail } from "../utils/email";
import csv from "csv-parser";
import { Readable } from "stream";

// ─── Question Management ───

export const createQuestion = async (
  questionData: Partial<IQuestion>,
  userId: string
) => {
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  const question = await Question.create({
    ...questionData,
    questionId: uuidv4(),
    createdBy: user._id,
  });

  return question;
};

export const updateQuestion = async (
  questionId: string,
  updates: Partial<IQuestion>,
  userId: string
) => {
  const question = await Question.findOne({ questionId });
  if (!question) throw new AppError("Question not found", 404);

  // Ownership check — admin can update any, teacher can only update own
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  if (
    user.role === UserRole.TEACHER &&
    question.createdBy.toString() !== user._id.toString()
  ) {
    throw new AppError("You can only update questions you created", 403);
  }

  Object.assign(question, updates);
  await question.save();

  return question;
};

export const deleteQuestion = async (questionId: string, userId: string) => {
  const question = await Question.findOne({ questionId });
  if (!question) throw new AppError("Question not found", 404);

  // Ownership check
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  if (
    user.role === UserRole.TEACHER &&
    question.createdBy.toString() !== user._id.toString()
  ) {
    throw new AppError("You can only delete questions you created", 403);
  }

  // Check if question is used in any quiz
  const quizUsingQuestion = await Quiz.findOne({
    questions: question._id,
    isDeleted: { $ne: true },
  });

  if (quizUsingQuestion) {
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

export const getQuestions = async (filters: {
  subject?: string;
  grade?: string;
  difficulty?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  createdBy?: string;
}) => {
  const {
    subject,
    grade,
    difficulty,
    isActive = true,
    page = 1,
    limit = 20,
    createdBy,
  } = filters;

  const query: any = { isActive };

  if (subject) query.subject = subject;
  if (grade) query.grade = grade;
  if (difficulty) query.difficulty = difficulty;
  if (createdBy) query.createdBy = createdBy;

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

// ─── Quiz Management ───

export const createQuiz = async (
  quizData: Partial<IQuiz>,
  userId: string
) => {
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  const questions = await Question.find({
    _id: { $in: quizData.questions },
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const quiz = await Quiz.create({
    ...quizData,
    quizId: uuidv4(),
    totalPoints,
    createdBy: user._id,
  });

  return quiz;
};

export const updateQuiz = async (
  quizId: string,
  updates: Partial<IQuiz>,
  userId: string
) => {
  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } });
  if (!quiz) throw new AppError("Quiz not found", 404);

  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  if (
    user.role === UserRole.TEACHER &&
    quiz.createdBy.toString() !== user._id.toString()
  ) {
    throw new AppError("You can only update quizzes you created", 403);
  }

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

export const deleteQuiz = async (quizId: string, userId: string) => {
  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } });
  if (!quiz) throw new AppError("Quiz not found", 404);

  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  if (
    user.role === UserRole.TEACHER &&
    quiz.createdBy.toString() !== user._id.toString()
  ) {
    throw new AppError("You can only delete quizzes you created", 403);
  }

  // Dependency check — soft delete if attempts exist
  const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id });
  if (attemptCount > 0) {
    quiz.isDeleted = true;
    quiz.status = "archived" as any;
    await quiz.save();
    return {
      message:
        "Quiz has student submissions and has been archived instead of deleted",
    };
  }

  await Quiz.deleteOne({ quizId });
  return { message: "Quiz deleted successfully" };
};

export const assignQuiz = async (
  quizId: string,
  studentIds: string[]
) => {
  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } });
  if (!quiz) throw new AppError("Quiz not found", 404);

  const students = await User.find({
    userId: { $in: studentIds },
    role: UserRole.STUDENT,
    isDeleted: { $ne: true },
  });

  if (students.length === 0) throw new AppError("No valid students found", 404);

  const currentAssignedIds = quiz.assignedTo.map((id) => id.toString());
  const newStudentIds = students
    .map((s) => s._id)
    .filter((id) => !currentAssignedIds.includes(id.toString()));

  quiz.assignedTo.push(...newStudentIds);
  await quiz.save();

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

export const getQuizzes = async (filters: {
  status?: string;
  subject?: string;
  grade?: string;
  page?: number;
  limit?: number;
  createdBy?: string;
}) => {
  const { status, subject, grade, page = 1, limit = 20, createdBy } = filters;

  const query: any = { isDeleted: { $ne: true } };

  if (status) query.status = status;
  if (subject) query.subject = subject;
  if (grade) query.grade = grade;
  if (createdBy) query.createdBy = createdBy;

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

export const getQuizResults = async (quizId: string) => {
  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } });
  if (!quiz) throw new AppError("Quiz not found", 404);

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

// ─── Student Management ───

export const getStudents = async (filters: {
  isActive?: boolean;
  grade?: string;
  page?: number;
  limit?: number;
}) => {
  const { isActive, grade, page = 1, limit = 20 } = filters;

  const query: any = { role: UserRole.STUDENT, isDeleted: { $ne: true } };

  if (typeof isActive === "boolean") query.isActive = isActive;
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

export const toggleStudentStatus = async (
  userId: string,
  isActive: boolean
) => {
  const student = await User.findOne({
    userId,
    role: UserRole.STUDENT,
    isDeleted: { $ne: true },
  });
  if (!student) throw new AppError("Student not found", 404);

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

export const deleteStudent = async (userId: string) => {
  const student = await User.findOne({
    userId,
    role: UserRole.STUDENT,
    isDeleted: { $ne: true },
  });
  if (!student) throw new AppError("Student not found", 404);

  student.isDeleted = true;
  student.isActive = false;
  student.deletedAt = new Date();
  await student.save();

  return { message: "Student account deleted successfully" };
};

// ─── Teacher Management ───

export const getTeachers = async (filters: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const { isActive, page = 1, limit = 20 } = filters;

  const query: any = { role: UserRole.TEACHER, isDeleted: { $ne: true } };

  if (typeof isActive === "boolean") query.isActive = isActive;

  const skip = (page - 1) * limit;

  const [teachers, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  const enriched = await Promise.all(
    teachers.map(async (t) => {
      const [questionsCreated, quizzesCreated] = await Promise.all([
        Question.countDocuments({ createdBy: t._id }),
        Quiz.countDocuments({ createdBy: t._id, isDeleted: { $ne: true } }),
      ]);
      return {
        ...t.toObject(),
        questionsCreated,
        quizzesCreated,
      };
    })
  );

  return {
    teachers: enriched,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};

export const toggleTeacherStatus = async (
  userId: string,
  isActive: boolean
) => {
  const teacher = await User.findOne({
    userId,
    role: UserRole.TEACHER,
    isDeleted: { $ne: true },
  });
  if (!teacher) throw new AppError("Teacher not found", 404);

  teacher.isActive = isActive;
  await teacher.save();

  return {
    message: `Teacher account ${isActive ? "activated" : "deactivated"} successfully`,
    teacher: {
      userId: teacher.userId,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      isActive: teacher.isActive,
    },
  };
};

export const deleteTeacher = async (userId: string) => {
  const teacher = await User.findOne({
    userId,
    role: UserRole.TEACHER,
    isDeleted: { $ne: true },
  });
  if (!teacher) throw new AppError("Teacher not found", 404);

  const activeQuizzes = await Quiz.countDocuments({
    createdBy: teacher._id,
    status: "active",
    isDeleted: { $ne: true },
  });

  if (activeQuizzes > 0) {
    throw new AppError(
      `Cannot delete teacher with ${activeQuizzes} active quiz(es). Archive quizzes first.`,
      400
    );
  }

  await Quiz.updateMany(
    { createdBy: teacher._id, isDeleted: { $ne: true } },
    { status: "archived" }
  );

  teacher.isDeleted = true;
  teacher.isActive = false;
  teacher.deletedAt = new Date();
  await teacher.save();

  return { message: "Teacher account deleted successfully" };
};

// ─── Dashboard Stats ───

export const getDashboardStats = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalQuestions,
    totalQuizzes,
    totalSubmissions,
    scoreAgg,
    newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments({ role: UserRole.STUDENT, isDeleted: { $ne: true } }),
    User.countDocuments({ role: UserRole.TEACHER, isDeleted: { $ne: true } }),
    Question.countDocuments({ isActive: true }),
    Quiz.countDocuments({ isDeleted: { $ne: true } }),
    QuizAttempt.countDocuments({ status: "completed" }),
    QuizAttempt.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, avg: { $avg: "$percentage" } } },
    ]),
    User.countDocuments({
      isDeleted: { $ne: true },
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  const activeStudents = await User.countDocuments({
    role: UserRole.STUDENT,
    isActive: true,
    isDeleted: { $ne: true },
  });
  const activeTeachers = await User.countDocuments({
    role: UserRole.TEACHER,
    isActive: true,
    isDeleted: { $ne: true },
  });

  return {
    totalStudents,
    totalTeachers,
    totalQuestions,
    totalQuizzes,
    totalSubmissions,
    averageScore: Math.round(scoreAgg[0]?.avg || 0),
    activeUsers: activeStudents + activeTeachers,
    newUsersThisMonth,
  };
};

// ─── CSV Import ───

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

            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash(password, 12);

            await User.create({
              userId: uuidv4(),
              username: email.split("@")[0] + Math.floor(Math.random() * 1000),
              email,
              firstName,
              lastName,
              grade,
              password: hashedPassword,
              role: UserRole.STUDENT,
              isEmailVerified: true,
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
