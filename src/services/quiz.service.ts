import { v4 as uuidv4 } from "uuid";
import Quiz, { QuizStatus } from "../models/Quiz.schema";
import QuizAttempt, { AttemptStatus } from "../models/QuizAttempt.schema";
import Question from "../models/Question.schema";
import User, { UserRole } from "../models/User.schema";
import { AppError } from "../middlewares/errorHandler";
import mongoose from "mongoose";

/**
 * Resolve quiz questions — handles both ObjectId refs and UUID strings.
 * Quizzes created before the UUID→ObjectId fix may have UUID strings in the questions array.
 */
const resolveQuizQuestions = async (quiz: any) => {
  const rawIds = (quiz.questions || []) as any[];
  if (rawIds.length === 0) return [];

  // Check if first entry is a populated document (has _id and title)
  if (rawIds[0]?.title) return rawIds;

  // Check if entries are valid ObjectIds or UUID strings
  const firstId = String(rawIds[0]);
  const isObjectId = /^[a-f\d]{24}$/i.test(firstId);

  if (isObjectId) {
    // Normal ObjectId refs — query by _id
    return Question.find({ _id: { $in: rawIds } });
  }

  // UUID strings — query by questionId field
  const questions = await Question.find({ questionId: { $in: rawIds.map(String) } });

  // Also fix the quiz document so future lookups work with populate
  if (questions.length > 0) {
    await Quiz.updateOne(
      { _id: quiz._id },
      { $set: { questions: questions.map((q) => q._id) } }
    );
  }

  return questions;
};

export const getStudentQuizzes = async (userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const quizzes = await Quiz.find({
    assignedTo: user._id,
    status: QuizStatus.ACTIVE,
    isDeleted: { $ne: true },
  })
    .select("-questions")
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 });

  const quizObjectIds = quizzes.map((q) => q._id);

  // Batch fetch all attempts for this student across all assigned quizzes (avoids N+1)
  const allAttempts = await QuizAttempt.find({
    quizId: { $in: quizObjectIds },
    studentId: user._id,
  }).select("quizId score percentage isPassed completedAt status");

  // Group attempts by quizId in memory
  const attemptsByQuiz: Record<string, typeof allAttempts> = {};
  for (const attempt of allAttempts) {
    const key = attempt.quizId.toString();
    if (!attemptsByQuiz[key]) attemptsByQuiz[key] = [];
    attemptsByQuiz[key].push(attempt);
  }

  const quizzesWithAttempts = quizzes.map((quiz) => {
    const attempts = attemptsByQuiz[quiz._id.toString()] || [];
    const completedAttempts = attempts.filter((a) => a.status === AttemptStatus.COMPLETED);
    const lastAttempt = completedAttempts.sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    )[0] || null;
    return {
      ...quiz.toObject(),
      attemptCount: attempts.length,
      lastAttempt,
    };
  });

  return quizzesWithAttempts;
};

export const startQuiz = async (quizId: string, userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } });
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  if (!quiz.assignedTo.some((id) => id.toString() === user._id.toString())) {
    throw new AppError("You are not assigned to this quiz", 403);
  }

  if (quiz.status !== QuizStatus.ACTIVE) {
    throw new AppError("This quiz is not currently available", 400);
  }

  if (quiz.startDate && new Date() < quiz.startDate) {
    throw new AppError("This quiz has not started yet", 400);
  }
  if (quiz.endDate) {
    // Allow the entire due date day — only block after end of day
    const endOfDay = new Date(quiz.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (new Date() > endOfDay) {
      throw new AppError("This quiz has ended", 400);
    }
  }

  // Resolve questions (handles both ObjectId refs and UUID strings)
  const resolvedQuestions = await resolveQuizQuestions(quiz);

  const incompleteAttempt = await QuizAttempt.findOne({
    quizId: quiz._id,
    studentId: user._id,
    status: AttemptStatus.IN_PROGRESS,
  });

  if (incompleteAttempt) {
    return {
      attempt: incompleteAttempt,
      quiz: {
        ...quiz.toObject(),
        questions: resolvedQuestions.map((q: any) => {
          const qObj = q.toObject ? q.toObject() : q;
          return {
            ...qObj,
            correctAnswer: undefined,
            options: (qObj.options || []).map((opt: any) => ({
              text: opt.text,
              isCorrect: undefined,
            })),
          };
        }),
      },
    };
  }

  let selectedQuestions = resolvedQuestions as any[];
  if (quiz.isRandomized && quiz.numberOfQuestions) {
    selectedQuestions = selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, quiz.numberOfQuestions);
  }

  const attempt = await QuizAttempt.create({
    attemptId: uuidv4(),
    quizId: quiz._id,
    studentId: user._id,
    answers: [],
    score: 0,
    percentage: 0,
    totalPoints: quiz.totalPoints,
    status: AttemptStatus.IN_PROGRESS,
    startedAt: new Date(),
  });

  const sanitizedQuestions = selectedQuestions.map((q: any) => {
    const qObj = q.toObject ? q.toObject() : q;
    return {
      _id: qObj._id,
      questionId: qObj.questionId,
      title: qObj.title,
      description: qObj.description,
      questionType: qObj.questionType,
      difficulty: qObj.difficulty,
      subject: qObj.subject,
      grade: qObj.grade,
      options: (qObj.options || []).map((opt: any) => ({
        text: opt.text,
      })),
      points: qObj.points,
      imageUrl: qObj.imageUrl,
    };
  });

  return {
    attempt,
    quiz: {
      ...quiz.toObject(),
      questions: sanitizedQuestions,
    },
  };
};

export const submitQuiz = async (
  attemptId: string,
  userId: string,
  answers: Array<{ questionId: string; selectedAnswer: string | string[] }>
) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const attempt = await QuizAttempt.findOne({ attemptId }).populate("quizId");
  if (!attempt) {
    throw new AppError("Quiz attempt not found", 404);
  }

  if (attempt.studentId.toString() !== user._id.toString()) {
    throw new AppError("Unauthorized", 403);
  }

  if (attempt.status === AttemptStatus.COMPLETED) {
    throw new AppError("Quiz already submitted", 400);
  }

  const quiz = await Quiz.findById(attempt.quizId);
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  // Resolve questions (handles both ObjectId refs and UUID strings)
  const resolvedQuestions = await resolveQuizQuestions(quiz);

  let isLateSubmission = false;
  if (quiz.timeLimit) {
    const elapsedMinutes =
      (new Date().getTime() - attempt.startedAt.getTime()) / 60000;
    const hardLimit = quiz.timeLimit * 1.5;

    if (elapsedMinutes > hardLimit) {
      throw new AppError(
        "Submission rejected. Time limit exceeded by too much.",
        400
      );
    }

    if (elapsedMinutes > quiz.timeLimit) {
      isLateSubmission = true;
    }
  }

  let totalScore = 0;
  const gradedAnswers = answers.map((answer) => {
    const question: any = resolvedQuestions.find(
      (q: any) => q.questionId === answer.questionId
    );

    if (!question) {
      return {
        questionId: new mongoose.Types.ObjectId(),
        selectedAnswer: answer.selectedAnswer,
        isCorrect: false,
        pointsEarned: 0,
      };
    }

    let isCorrect = false;

    if (question.questionType === "multiple_choice") {
      const correctOption = question.options.find((opt: any) => opt.isCorrect);
      isCorrect = correctOption?.text === answer.selectedAnswer;
    } else if (question.questionType === "true_false") {
      const correctOption = question.options.find((opt: any) => opt.isCorrect);
      isCorrect = correctOption?.text === answer.selectedAnswer;
    } else if (question.questionType === "short_answer") {
      isCorrect =
        question.correctAnswer?.toLowerCase().trim() ===
        (answer.selectedAnswer as string).toLowerCase().trim();
    }

    const pointsEarned = isCorrect ? question.points : 0;
    totalScore += pointsEarned;

    return {
      questionId: question._id,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
      pointsEarned,
    };
  });

  const percentage = (totalScore / quiz.totalPoints) * 100;
  const isPassed = percentage >= quiz.passingScore;

  attempt.answers = gradedAnswers;
  attempt.score = totalScore;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
  attempt.status = AttemptStatus.COMPLETED;
  attempt.isLateSubmission = isLateSubmission;
  attempt.completedAt = new Date();
  attempt.timeSpent = Math.floor(
    (new Date().getTime() - attempt.startedAt.getTime()) / 1000
  );
  await attempt.save();

  const detailedResults = await QuizAttempt.findById(attempt._id)
    .populate({
      path: "quizId",
      select: "title description subject grade passingScore",
    })
    .populate({
      path: "answers.questionId",
      select:
        "title description questionType options correctAnswer explanation imageUrl points",
    });

  return detailedResults;
};

export const getQuizResult = async (attemptId: string, userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const result = await QuizAttempt.findOne({ attemptId })
    .populate({
      path: "quizId",
      select: "title description subject grade passingScore totalPoints createdBy",
    })
    .populate({
      path: "answers.questionId",
      select:
        "title description questionType options correctAnswer explanation imageUrl points",
    })
    .populate("studentId", "firstName lastName email userId");

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  const isStudent = result.studentId._id.toString() === user._id.toString();
  const isQuizCreator = (result.quizId as any)?.createdBy?.toString() === user._id.toString();
  const isAdminOrTeacher = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;

  if (!isStudent && !(isAdminOrTeacher && isQuizCreator)) {
    throw new AppError("Unauthorized", 403);
  }

  return result;
};

export const getStudentAttempts = async (userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const attempts = await QuizAttempt.find({
    studentId: user._id,
    status: AttemptStatus.COMPLETED,
  })
    .populate("quizId", "title subject grade")
    .sort({ completedAt: -1 });

  return attempts;
};
