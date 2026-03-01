import { v4 as uuidv4 } from "uuid";
import Quiz, { QuizStatus } from "../models/Quiz.schema";
import QuizAttempt, { AttemptStatus } from "../models/QuizAttempt.schema";
import User from "../models/User.schema";
import { AppError } from "../middlewares/errorHandler";
import mongoose from "mongoose";

/**
 * Get all quizzes assigned to a student (US-007)
 */
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

  // Get attempt counts for each quiz
  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (quiz) => {
      const attemptCount = await QuizAttempt.countDocuments({
        quizId: quiz._id,
        studentId: user._id,
      });

      const lastAttempt = await QuizAttempt.findOne({
        quizId: quiz._id,
        studentId: user._id,
        status: AttemptStatus.COMPLETED,
      })
        .sort({ completedAt: -1 })
        .select("score percentage isPassed completedAt");

      return {
        ...quiz.toObject(),
        attemptCount,
        lastAttempt,
      };
    })
  );

  return quizzesWithAttempts;
};

/**
 * Get quiz details and start quiz (US-004)
 */
export const startQuiz = async (quizId: string, userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const quiz = await Quiz.findOne({ quizId, isDeleted: { $ne: true } }).populate("questions");
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  // Check if quiz is assigned to student
  if (!quiz.assignedTo.some((id) => id.toString() === user._id.toString())) {
    throw new AppError("You are not assigned to this quiz", 403);
  }

  // Check if quiz is active
  if (quiz.status !== QuizStatus.ACTIVE) {
    throw new AppError("This quiz is not currently available", 400);
  }

  // Check date range
  if (quiz.startDate && new Date() < quiz.startDate) {
    throw new AppError("This quiz has not started yet", 400);
  }
  if (quiz.endDate && new Date() > quiz.endDate) {
    throw new AppError("This quiz has ended", 400);
  }

  // Check for incomplete attempts
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
        questions: quiz.questions.map((q: any) => ({
          ...q.toObject(),
          correctAnswer: undefined,
          options: q.options.map((opt: any) => ({
            text: opt.text,
            isCorrect: undefined,
          })),
        })),
      },
    };
  }

  // Get questions (randomized if needed) - US-004, US-005
  let selectedQuestions = quiz.questions as any[];
  if (quiz.isRandomized && quiz.numberOfQuestions) {
    selectedQuestions = selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, quiz.numberOfQuestions);
  }

  // Create new attempt
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

  // Remove correct answers from response
  const sanitizedQuestions = selectedQuestions.map((q) => ({
    _id: q._id,
    questionId: q.questionId,
    title: q.title,
    description: q.description,
    questionType: q.questionType,
    difficulty: q.difficulty,
    subject: q.subject,
    grade: q.grade,
    options: q.options.map((opt: any) => ({
      text: opt.text,
    })),
    points: q.points,
    imageUrl: q.imageUrl,
  }));

  return {
    attempt,
    quiz: {
      ...quiz.toObject(),
      questions: sanitizedQuestions,
    },
  };
};

/**
 * Submit quiz answers (US-006, US-010, US-011)
 */
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

  const quiz = await Quiz.findById(attempt.quizId).populate("questions");
  if (!quiz) {
    throw new AppError("Quiz not found", 404);
  }

  // Time limit enforcement
  let isLateSubmission = false;
  if (quiz.timeLimit) {
    const elapsedMinutes =
      (new Date().getTime() - attempt.startedAt.getTime()) / 60000;
    const hardLimit = quiz.timeLimit * 1.5; // 50% grace period

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

  // Grade answers
  let totalScore = 0;
  const gradedAnswers = answers.map((answer) => {
    const question: any = quiz.questions.find(
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

    // Check answer based on question type
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

  // Calculate percentage
  const percentage = (totalScore / quiz.totalPoints) * 100;
  const isPassed = percentage >= quiz.passingScore;

  // Update attempt
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

  // Return full results with correct answers (US-011)
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

/**
 * Get quiz result details (US-010, US-011, US-012)
 */
export const getQuizResult = async (attemptId: string, userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const result = await QuizAttempt.findOne({ attemptId })
    .populate({
      path: "quizId",
      select: "title description subject grade passingScore totalPoints",
    })
    .populate({
      path: "answers.questionId",
      select:
        "title description questionType options correctAnswer explanation imageUrl points",
    })
    .populate("studentId", "firstName lastName email");

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  if (result.studentId._id.toString() !== user._id.toString()) {
    throw new AppError("Unauthorized", 403);
  }

  return result;
};

/**
 * Get all quiz attempts for a student (US-013)
 */
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
