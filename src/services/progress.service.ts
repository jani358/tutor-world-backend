import QuizAttempt, { AttemptStatus } from "../models/QuizAttempt.schema";
import User from "../models/User.schema";
import { AppError } from "../middlewares/errorHandler";

export const getStudentProgress = async (userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const attempts = await QuizAttempt.find({
    studentId: user._id,
    status: AttemptStatus.COMPLETED,
  }).populate("quizId", "title subject grade");

  const totalQuizzes = attempts.length;
  const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
  const averageScore =
    totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0;

  const passedQuizzes = attempts.filter((a) => a.isPassed).length;
  const passRate =
    totalQuizzes > 0 ? ((passedQuizzes / totalQuizzes) * 100).toFixed(2) : 0;

  const subjectStats: any = {};
  attempts.forEach((attempt: any) => {
    const subject = attempt.quizId.subject;
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        totalAttempts: 0,
        totalScore: 0,
        passed: 0,
      };
    }
    subjectStats[subject].totalAttempts++;
    subjectStats[subject].totalScore += attempt.score;
    if (attempt.isPassed) subjectStats[subject].passed++;
  });

  const subjectBreakdown = Object.entries(subjectStats).map(
    ([subject, stats]: [string, any]) => ({
      subject,
      attempts: stats.totalAttempts,
      averageScore: (stats.totalScore / stats.totalAttempts).toFixed(2),
      passRate: ((stats.passed / stats.totalAttempts) * 100).toFixed(2),
    })
  );

  return {
    overview: {
      totalQuizzes,
      averageScore,
      passRate,
      passedQuizzes,
      failedQuizzes: totalQuizzes - passedQuizzes,
    },
    subjectBreakdown,
  };
};

export const getDetailedStatistics = async (userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const attempts = await QuizAttempt.find({
    studentId: user._id,
    status: AttemptStatus.COMPLETED,
  })
    .populate("quizId", "title subject grade difficulty")
    .sort({ completedAt: -1 });

  const difficultyStats: any = {
    easy: { total: 0, passed: 0, averageScore: 0 },
    medium: { total: 0, passed: 0, averageScore: 0 },
    hard: { total: 0, passed: 0, averageScore: 0 },
  };

  attempts.forEach((attempt: any) => {
    let difficulty = "medium";
    if (attempt.percentage >= 80) difficulty = "easy";
    else if (attempt.percentage < 60) difficulty = "hard";

    difficultyStats[difficulty].total++;
    difficultyStats[difficulty].averageScore += attempt.percentage;
    if (attempt.isPassed) difficultyStats[difficulty].passed++;
  });

  Object.keys(difficultyStats).forEach((key) => {
    const stat = difficultyStats[key];
    if (stat.total > 0) {
      stat.averageScore = (stat.averageScore / stat.total).toFixed(2);
      stat.passRate = ((stat.passed / stat.total) * 100).toFixed(2);
    }
  });

  return {
    difficultyStats,
    recentAttempts: attempts.slice(0, 10),
  };
};

export const getProgressChart = async (
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    subject?: string;
  }
) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const query: any = {
    studentId: user._id,
    status: AttemptStatus.COMPLETED,
  };

  if (filters?.startDate || filters?.endDate) {
    query.completedAt = {};
    if (filters.startDate) query.completedAt.$gte = filters.startDate;
    if (filters.endDate) query.completedAt.$lte = filters.endDate;
  }

  const attempts = await QuizAttempt.find(query)
    .populate("quizId", "title subject grade")
    .sort({ completedAt: 1 });

  let filteredAttempts = attempts;
  if (filters?.subject) {
    filteredAttempts = attempts.filter(
      (a: any) => a.quizId.subject === filters.subject
    );
  }

  const chartData = filteredAttempts.map((attempt) => ({
    date: attempt.completedAt,
    score: attempt.score,
    percentage: attempt.percentage,
    quizTitle: (attempt.quizId as any).title,
    subject: (attempt.quizId as any).subject,
    isPassed: attempt.isPassed,
  }));

  let trend = "stable";
  if (chartData.length >= 5) {
    const recentAvg =
      chartData
        .slice(-5)
        .reduce((sum, d) => sum + d.percentage, 0) / 5;
    const earlierAvg =
      chartData
        .slice(0, Math.min(5, chartData.length - 5))
        .reduce((sum, d) => sum + d.percentage, 0) /
      Math.min(5, chartData.length - 5);

    if (recentAvg > earlierAvg + 5) trend = "improving";
    else if (recentAvg < earlierAvg - 5) trend = "declining";
  }

  return {
    chartData,
    trend,
    summary: {
      totalAttempts: chartData.length,
      averagePercentage: chartData.length > 0
        ? (
            chartData.reduce((sum, d) => sum + d.percentage, 0) /
            chartData.length
          ).toFixed(2)
        : 0,
    },
  };
};
