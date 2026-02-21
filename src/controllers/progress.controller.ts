import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as progressService from "../services/progress.service";
import { asyncHandler } from "../middlewares/errorHandler";

/**
 * Get student progress overview (US-009, US-013)
 */
export const getProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const progress = await progressService.getStudentProgress(
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      data: progress,
    });
  }
);

/**
 * Get detailed statistics (US-014)
 */
export const getStatistics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const stats = await progressService.getDetailedStatistics(
      req.user!.userId
    );

    res.status(200).json({
      status: "success",
      data: stats,
    });
  }
);

/**
 * Get progress chart data (US-013, US-015)
 */
export const getChart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const filters: any = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.subject) {
      filters.subject = req.query.subject as string;
    }

    const chartData = await progressService.getProgressChart(
      req.user!.userId,
      filters
    );

    res.status(200).json({
      status: "success",
      data: chartData,
    });
  }
);
