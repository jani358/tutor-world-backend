import { v4 as uuidv4 } from "uuid";
import Question, { IQuestion } from "../models/Question.schema";
import Quiz, { IQuiz } from "../models/Quiz.schema";
import User, { UserRole } from "../models/User.schema";
import QuizAttempt from "../models/QuizAttempt.schema";
import Class from "../models/Class.schema";
import Subject from "../models/Subject.schema";
import Notification from "../models/Notification.schema";
import { AppError } from "../middlewares/errorHandler";
import { sendQuizAssignmentEmail } from "../utils/email";
import csv from "csv-parser";
import { Readable } from "stream";

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

  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  if (
    user.role === UserRole.TEACHER &&
    question.createdBy.toString() !== user._id.toString()
  ) {
    throw new AppError("You can only delete questions you created", 403);
  }

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

export const createQuiz = async (
  quizData: Partial<IQuiz>,
  userId: string
) => {
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  // Frontend sends UUID questionId strings; resolve them to ObjectIds
  const rawIds = (quizData.questions || []) as any[];
  const isObjectId = rawIds.length > 0 && /^[a-f\d]{24}$/i.test(String(rawIds[0]));

  const questions = await Question.find(
    isObjectId ? { _id: { $in: rawIds } } : { questionId: { $in: rawIds } }
  );

  if (questions.length === 0) {
    throw new AppError("No valid questions found", 400);
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // Auto-determine quiz difficulty from selected questions (most common difficulty)
  const diffCounts: Record<string, number> = {};
  for (const q of questions) {
    const d = q.difficulty || "easy";
    diffCounts[d] = (diffCounts[d] || 0) + 1;
  }
  const autoDifficulty = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "easy";

  const quiz = await Quiz.create({
    ...quizData,
    questions: questions.map((q) => q._id),
    quizId: uuidv4(),
    totalPoints,
    difficulty: quizData.difficulty || autoDifficulty,
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
    const rawIds = updates.questions as any[];
    const isObjectId = rawIds.length > 0 && /^[a-f\d]{24}$/i.test(String(rawIds[0]));
    const questions = await Question.find(
      isObjectId ? { _id: { $in: rawIds } } : { questionId: { $in: rawIds } }
    );
    updates.questions = questions.map((q) => q._id);
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

  const newlyAssigned = students.filter((s) =>
    newStudentIds.some((id) => id.toString() === s._id.toString())
  );
  await Promise.all(
    newlyAssigned.map((student) =>
      sendQuizAssignmentEmail(student.email, student.firstName, quiz.title).catch(() => {})
    )
  );

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
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Quiz.countDocuments(query),
  ]);

  const enriched = quizzes.map((q) => {
    const obj = q.toObject();
    return {
      ...obj,
      questionCount: obj.questions?.length || obj.numberOfQuestions || 0,
      questions: undefined,
    };
  });

  return {
    quizzes: enriched,
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

// Returns all completed attempts across all quizzes in a single aggregation (no N+1)
export const getAllResults = async () => {
  const results = await QuizAttempt.find({ status: "completed" })
    .populate("studentId", "firstName lastName email userId")
    .populate("quizId", "title subject grade totalPoints quizId")
    .sort({ completedAt: -1 })
    .lean();

  return results;
};

export const updateStudent = async (
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; username?: string }
) => {
  const student = await User.findOne({ userId, role: UserRole.STUDENT, isDeleted: { $ne: true } });
  if (!student) throw new AppError("Student not found", 404);

  if (data.email && data.email !== student.email) {
    const exists = await User.findOne({ email: data.email, _id: { $ne: student._id } });
    if (exists) throw new AppError("Email already in use", 409);
  }
  if (data.username && data.username !== student.username) {
    const exists = await User.findOne({ username: data.username, _id: { $ne: student._id } });
    if (exists) throw new AppError("Username already in use", 409);
  }

  if (data.firstName) student.firstName = data.firstName;
  if (data.lastName) student.lastName = data.lastName;
  if (data.email) student.email = data.email;
  if (data.username) student.username = data.username;
  await student.save();

  return student;
};

export const updateTeacher = async (
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; username?: string }
) => {
  const teacher = await User.findOne({ userId, role: UserRole.TEACHER, isDeleted: { $ne: true } });
  if (!teacher) throw new AppError("Teacher not found", 404);

  if (data.email && data.email !== teacher.email) {
    const exists = await User.findOne({ email: data.email, _id: { $ne: teacher._id } });
    if (exists) throw new AppError("Email already in use", 409);
  }
  if (data.username && data.username !== teacher.username) {
    const exists = await User.findOne({ username: data.username, _id: { $ne: teacher._id } });
    if (exists) throw new AppError("Username already in use", 409);
  }

  if (data.firstName) teacher.firstName = data.firstName;
  if (data.lastName) teacher.lastName = data.lastName;
  if (data.email) teacher.email = data.email;
  if (data.username) teacher.username = data.username;
  await teacher.save();

  return teacher;
};

export const getAdminAttemptResult = async (attemptId: string) => {
  const result = await QuizAttempt.findOne({ attemptId })
    .populate({
      path: "quizId",
      select: "title description subject grade passingScore totalPoints",
    })
    .populate({
      path: "answers.questionId",
      select: "title description questionType options correctAnswer explanation imageUrl points",
    })
    .populate("studentId", "firstName lastName email userId");

  if (!result) throw new AppError("Result not found", 404);
  return result;
};

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

  const studentIds = students.map((s) => s._id);
  const classes = await Class.find({
    students: { $in: studentIds },
    isDeleted: { $ne: true },
  })
    .populate("teacher", "firstName lastName")
    .select("name students teacher");

  const studentClassMap: Record<string, { className: string; teacherName: string }> = {};
  for (const cls of classes) {
    const teacher = cls.teacher as any;
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
    for (const sid of cls.students) {
      studentClassMap[sid.toString()] = {
        className: cls.name,
        teacherName,
      };
    }
  }

  const enriched = students.map((s) => {
    const obj = s.toObject();
    const classInfo = studentClassMap[s._id.toString()];
    return {
      ...obj,
      className: classInfo?.className || "",
      teacherName: classInfo?.teacherName || "",
    };
  });

  return {
    students: enriched,
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

  const teacherIds = teachers.map((t) => t._id);
  const teacherClasses = await Class.find({
    teacher: { $in: teacherIds },
    isDeleted: { $ne: true },
  }).select("name teacher students");

  // Count only non-deleted students across all teacher classes
  const allClassStudentIds = teacherClasses.flatMap((cls) => cls.students || []);
  const nonDeletedStudentIds = allClassStudentIds.length > 0
    ? new Set(
        (await User.find({ _id: { $in: allClassStudentIds }, isDeleted: { $ne: true } }).select("_id").lean())
          .map((s) => s._id.toString())
      )
    : new Set<string>();

  const teacherClassMap: Record<string, { assignedClass: string; studentsManaged: number }> = {};
  for (const cls of teacherClasses) {
    const tid = cls.teacher?.toString();
    if (tid) {
      const count = (cls.students || []).filter((id) => nonDeletedStudentIds.has(id.toString())).length;
      teacherClassMap[tid] = {
        assignedClass: cls.name,
        studentsManaged: count,
      };
    }
  }

  // Batch-count questions and quizzes per teacher using aggregation (avoids N+1)
  const [questionCounts, quizCounts] = await Promise.all([
    Question.aggregate([
      { $match: { createdBy: { $in: teacherIds } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } },
    ]),
    Quiz.aggregate([
      { $match: { createdBy: { $in: teacherIds }, isDeleted: { $ne: true } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } },
    ]),
  ]);
  const questionCountMap: Record<string, number> = {};
  const quizCountMap: Record<string, number> = {};
  for (const r of questionCounts) questionCountMap[r._id.toString()] = r.count;
  for (const r of quizCounts) quizCountMap[r._id.toString()] = r.count;

  const enriched = teachers.map((t) => {
    const classInfo = teacherClassMap[t._id.toString()];
    return {
      ...t.toObject(),
      questionsCreated: questionCountMap[t._id.toString()] || 0,
      quizzesCreated: quizCountMap[t._id.toString()] || 0,
      assignedClass: classInfo?.assignedClass || "",
      studentsManaged: classInfo?.studentsManaged || 0,
    };
  });

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

export const getDashboardStats = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalQuestions,
    totalQuizzes,
    totalSubmissions,
    totalClasses,
    scoreAgg,
    newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments({ role: UserRole.STUDENT, isDeleted: { $ne: true } }),
    User.countDocuments({ role: UserRole.TEACHER, isDeleted: { $ne: true } }),
    Question.countDocuments({ isActive: true }),
    Quiz.countDocuments({ isDeleted: { $ne: true } }),
    QuizAttempt.countDocuments({ status: "completed" }),
    Class.countDocuments({ isDeleted: { $ne: true } }),
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

  const [activeStudents, activeTeachers] = await Promise.all([
    User.countDocuments({
      role: UserRole.STUDENT,
      isActive: true,
      isDeleted: { $ne: true },
    }),
    User.countDocuments({
      role: UserRole.TEACHER,
      isActive: true,
      isDeleted: { $ne: true },
    }),
  ]);

  const activeUsers = activeStudents + activeTeachers;
  const inactiveUsers = (totalStudents + totalTeachers) - activeUsers;

  return {
    totalStudents,
    totalTeachers,
    totalQuestions,
    totalQuizzes,
    totalSubmissions,
    totalClasses,
    averageScore: Math.round(scoreAgg[0]?.avg || 0),
    activeUsers,
    inactiveUsers,
    newUsersThisMonth,
  };
};

export const getRecentActivities = async (limit = 10) => {
  const AuditLog = (await import("../models/AuditLog.schema")).default;
  const logs = await AuditLog.find({})
    .populate("changedBy", "firstName lastName role")
    .sort({ createdAt: -1 })
    .limit(limit);
  return logs;
};

export const unassignStudentFromClass = async (studentUserId: string) => {
  const student = await User.findOne({
    userId: studentUserId,
    role: UserRole.STUDENT,
    isDeleted: { $ne: true },
  });
  if (!student) throw new AppError("Student not found", 404);

  const classDoc = await Class.findOne({
    students: student._id,
    isDeleted: { $ne: true },
  });
  if (!classDoc) throw new AppError("Student is not assigned to any class", 400);

  await Class.updateOne({ _id: classDoc._id }, { $pull: { students: student._id } });
  return { message: "Student removed from class successfully", className: classDoc.name };
};

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

export const getClasses = async (filters: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 20 } = filters;
  const query = { isDeleted: { $ne: true } };
  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate("teacher", "firstName lastName email userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Class.countDocuments(query),
  ]);

  // Collect all student IDs across classes and count only non-deleted ones
  const allStudentIds = classes.flatMap((c) => c.students || []);
  const activeStudentIds = allStudentIds.length > 0
    ? new Set(
        (await User.find({ _id: { $in: allStudentIds }, isDeleted: { $ne: true } }).select("_id").lean())
          .map((s) => s._id.toString())
      )
    : new Set<string>();

  const enriched = classes.map((c) => {
    const obj = c.toObject();
    const count = (obj.students || []).filter((id: any) => activeStudentIds.has(id.toString())).length;
    return {
      ...obj,
      studentCount: count,
    };
  });

  return {
    classes: enriched,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const createClass = async (data: {
  name: string;
  description?: string;
  teacherId?: string;
}) => {
  let teacherObjectId;
  if (data.teacherId) {
    const teacher = await User.findOne({
      userId: data.teacherId,
      role: UserRole.TEACHER,
      isDeleted: { $ne: true },
    });
    if (!teacher) throw new AppError("Teacher not found", 404);
    teacherObjectId = teacher._id;
  }

  const classDoc = await Class.create({
    classId: uuidv4(),
    name: data.name,
    description: data.description || "",
    teacher: teacherObjectId,
  });

  return classDoc;
};

export const updateClass = async (
  classId: string,
  updates: { name?: string; description?: string; status?: string; teacherId?: string | null }
) => {
  const classDoc = await Class.findOne({ classId, isDeleted: { $ne: true } });
  if (!classDoc) throw new AppError("Class not found", 404);

  if (updates.name) classDoc.name = updates.name;
  if (updates.description !== undefined) classDoc.description = updates.description;
  if (updates.status) classDoc.status = updates.status as "active" | "inactive";

  if ("teacherId" in updates) {
    if (updates.teacherId) {
      const teacher = await User.findOne({
        userId: updates.teacherId,
        role: UserRole.TEACHER,
        isDeleted: { $ne: true },
      });
      if (!teacher) throw new AppError("Teacher not found", 404);
      classDoc.teacher = teacher._id;
    } else {
      classDoc.teacher = undefined;
    }
  }

  await classDoc.save();
  return classDoc;
};

export const toggleClassStatus = async (
  classId: string,
  status: "active" | "inactive"
) => {
  const classDoc = await Class.findOne({ classId, isDeleted: { $ne: true } });
  if (!classDoc) throw new AppError("Class not found", 404);

  classDoc.status = status;
  await classDoc.save();

  return { message: `Class ${status === "active" ? "activated" : "deactivated"} successfully` };
};

export const deleteClass = async (classId: string) => {
  const classDoc = await Class.findOne({ classId, isDeleted: { $ne: true } });
  if (!classDoc) throw new AppError("Class not found", 404);

  classDoc.isDeleted = true;
  classDoc.deletedAt = new Date();
  await classDoc.save();

  return { message: "Class deleted successfully" };
};

export const assignTeacherToClass = async (
  classId: string,
  teacherId: string
) => {
  const classDoc = await Class.findOne({ classId, isDeleted: { $ne: true } });
  if (!classDoc) throw new AppError("Class not found", 404);

  const teacher = await User.findOne({
    userId: teacherId,
    role: UserRole.TEACHER,
    isDeleted: { $ne: true },
  });
  if (!teacher) throw new AppError("Teacher not found", 404);

  // Prevent assigning a teacher who is already assigned to a different active class
  const existingClass = await Class.findOne({
    teacher: teacher._id,
    isDeleted: { $ne: true },
    classId: { $ne: classId },
  });
  if (existingClass) {
    throw new AppError(
      `This teacher is already assigned to "${existingClass.name}". Remove them from that class first.`,
      400
    );
  }

  classDoc.teacher = teacher._id;
  await classDoc.save();

  return {
    message: "Teacher assigned to class successfully",
    teacher: {
      userId: teacher.userId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
    },
  };
};

export const assignStudentToClass = async (
  studentUserId: string,
  classId: string
) => {
  const classDoc = await Class.findOne({ classId, isDeleted: { $ne: true } });
  if (!classDoc) throw new AppError("Class not found", 404);

  const student = await User.findOne({
    userId: studentUserId,
    role: UserRole.STUDENT,
    isDeleted: { $ne: true },
  });
  if (!student) throw new AppError("Student not found", 404);

  // Prevent assigning a student who is already in a different class
  const existingClass = await Class.findOne({
    students: student._id,
    isDeleted: { $ne: true },
    classId: { $ne: classId },
  });
  if (existingClass) {
    throw new AppError(
      `This student is already assigned to "${existingClass.name}". Remove them from that class first.`,
      400
    );
  }

  // If student is already in this exact class, do nothing (idempotent)
  if (classDoc.students.some((id) => id.toString() === student._id.toString())) {
    throw new AppError(`This student is already assigned to "${classDoc.name}".`, 400);
  }

  await Class.updateOne(
    { _id: classDoc._id },
    { $addToSet: { students: student._id } }
  );

  return { message: "Student assigned to class successfully" };
};

export const getSubjects = async (filters: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 20 } = filters;
  const query = { isDeleted: { $ne: true } };
  const skip = (page - 1) * limit;

  const [subjects, total] = await Promise.all([
    Subject.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Subject.countDocuments(query),
  ]);

  return {
    subjects,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const createSubject = async (data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}) => {
  const slug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await Subject.findOne({
    slug,
    isDeleted: { $ne: true },
  });
  if (existing) throw new AppError("A subject with this name already exists", 409);

  const subject = await Subject.create({
    subjectId: uuidv4(),
    name: data.name,
    slug,
    description: data.description || "",
    icon: data.icon || "BookOpen",
    color: data.color || "#44A194",
  });

  return subject;
};

export const toggleSubjectStatus = async (
  subjectId: string,
  status: "active" | "inactive"
) => {
  const subject = await Subject.findOne({
    subjectId,
    isDeleted: { $ne: true },
  });
  if (!subject) throw new AppError("Subject not found", 404);

  subject.status = status;
  await subject.save();

  return {
    message: `Subject ${status === "active" ? "activated" : "deactivated"} successfully`,
  };
};

export const deleteSubject = async (subjectId: string) => {
  const subject = await Subject.findOne({
    subjectId,
    isDeleted: { $ne: true },
  });
  if (!subject) throw new AppError("Subject not found", 404);

  subject.isDeleted = true;
  subject.deletedAt = new Date();
  await subject.save();

  return { message: "Subject deleted successfully" };
};

export const getNotifications = async (filters: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 20 } = filters;
  const query = { isDeleted: { $ne: true } };
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const createNotification = async (
  data: {
    title: string;
    message: string;
    type?: string;
    target?: string;
    expiresAt?: Date;
  },
  userId: string
) => {
  const user = await User.findOne({ userId, isDeleted: { $ne: true } });
  if (!user) throw new AppError("User not found", 404);

  const notification = await Notification.create({
    notificationId: uuidv4(),
    title: data.title,
    message: data.message,
    type: data.type || "info",
    target: data.target || "all",
    expiresAt: data.expiresAt,
    createdBy: user._id,
  });

  return notification;
};

export const deleteNotification = async (notificationId: string) => {
  const notification = await Notification.findOne({
    notificationId,
    isDeleted: { $ne: true },
  });
  if (!notification) throw new AppError("Notification not found", 404);

  notification.isDeleted = true;
  notification.deletedAt = new Date();
  await notification.save();

  return { message: "Notification deleted successfully" };
};

export const markNotificationRead = async (notificationId: string) => {
  const notification = await Notification.findOne({
    notificationId,
    isDeleted: { $ne: true },
  });
  if (!notification) throw new AppError("Notification not found", 404);

  notification.isRead = true;
  await notification.save();

  return { message: "Notification marked as read" };
};
