import QuizAttempt, { AttemptStatus } from "../models/QuizAttempt.schema";
import Quiz, { QuizStatus } from "../models/Quiz.schema";
import User from "../models/User.schema";
import { AppError } from "../middlewares/errorHandler";

export const getStudentProgress = async (userId: string) => {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get total assigned quizzes count
  const totalQuizzes = await Quiz.countDocuments({
    assignedTo: user._id,
    status: QuizStatus.ACTIVE,
    isDeleted: { $ne: true },
  });

  // Get all completed attempts
  const attempts = await QuizAttempt.find({
    studentId: user._id,
    status: AttemptStatus.COMPLETED,
  })
    .populate("quizId", "title subject grade difficulty")
    .sort({ completedAt: -1 });

  const completedQuizzes = attempts.length;
  const percentages = attempts.map((a) => a.percentage);

  const averageScore =
    completedQuizzes > 0
      ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / completedQuizzes)
      : 0;
  const highestScore =
    completedQuizzes > 0 ? Math.round(Math.max(...percentages)) : 0;
  const lowestScore =
    completedQuizzes > 0 ? Math.round(Math.min(...percentages)) : 0;

  // Recent scores (last 12 for chart)
  const recentScores = attempts.slice(0, 12).map((a: any) => ({
    quizName: a.quizId?.title || "Quiz",
    score: Math.round(a.percentage),
    date: a.completedAt?.toISOString() || "",
  }));

  // Subject performance
  const subjectMap: Record<
    string,
    { totalPercentage: number; count: number }
  > = {};
  attempts.forEach((a: any) => {
    const subject = a.quizId?.subject || "General";
    if (!subjectMap[subject]) {
      subjectMap[subject] = { totalPercentage: 0, count: 0 };
    }
    subjectMap[subject].totalPercentage += a.percentage;
    subjectMap[subject].count++;
  });
  const subjectPerformance = Object.entries(subjectMap).map(
    ([subject, stats]) => ({
      subject,
      average: Math.round(stats.totalPercentage / stats.count),
      total: stats.count,
    })
  );

  // Difficulty performance — use quiz's actual difficulty field
  const difficultyPerformance = { beginner: 0, intermediate: 0, advanced: 0 };
  const diffCounts = { beginner: 0, intermediate: 0, advanced: 0 };

  attempts.forEach((a: any) => {
    const diff = a.quizId?.difficulty || "easy";
    let key: "beginner" | "intermediate" | "advanced";
    if (diff === "easy") key = "beginner";
    else if (diff === "medium") key = "intermediate";
    else key = "advanced";

    difficultyPerformance[key] += a.percentage;
    diffCounts[key]++;
  });

  if (diffCounts.beginner > 0)
    difficultyPerformance.beginner = Math.round(
      difficultyPerformance.beginner / diffCounts.beginner
    );
  if (diffCounts.intermediate > 0)
    difficultyPerformance.intermediate = Math.round(
      difficultyPerformance.intermediate / diffCounts.intermediate
    );
  if (diffCounts.advanced > 0)
    difficultyPerformance.advanced = Math.round(
      difficultyPerformance.advanced / diffCounts.advanced
    );

  // Improvement: compare last 3 vs previous 3 attempts
  let improvementPercentage = 0;
  if (completedQuizzes >= 6) {
    const recent3Avg =
      percentages.slice(0, 3).reduce((s, p) => s + p, 0) / 3;
    const prev3Avg =
      percentages.slice(3, 6).reduce((s, p) => s + p, 0) / 3;
    improvementPercentage = Math.round(recent3Avg - prev3Avg);
  } else if (completedQuizzes >= 2) {
    improvementPercentage = Math.round(percentages[0] - percentages[completedQuizzes - 1]);
  }

  // Streak: consecutive days with at least one completed quiz (from most recent)
  let streakDays = 0;
  if (completedQuizzes > 0) {
    const completionDates = [
      ...new Set(
        attempts
          .filter((a) => a.completedAt)
          .map((a) => a.completedAt!.toISOString().split("T")[0])
      ),
    ].sort((a, b) => b.localeCompare(a)); // descending

    const today = new Date().toISOString().split("T")[0];
    // Only count streak if last completion was today or yesterday
    if (completionDates.length > 0) {
      const lastDate = completionDates[0];
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 1) {
        streakDays = 1;
        for (let i = 1; i < completionDates.length; i++) {
          const curr = new Date(completionDates[i - 1]);
          const prev = new Date(completionDates[i]);
          const diff = Math.floor(
            (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }
  }

  return {
    totalQuizzes,
    completedQuizzes,
    averageScore,
    highestScore,
    lowestScore,
    recentScores,
    subjectPerformance,
    difficultyPerformance,
    improvementPercentage,
    streakDays,
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
    const difficulty = attempt.quizId?.difficulty || "easy";
    if (!difficultyStats[difficulty]) {
      difficultyStats[difficulty] = { total: 0, passed: 0, averageScore: 0 };
    }
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
