import { Application } from "express";
import authRoutes from "./auth.routes";
import quizRoutes from "./quiz.routes";
import adminRoutes from "./admin.routes";
import progressRoutes from "./progress.routes";

export const setupRoutes = (app: Application): void => {
  // API version prefix
  const API_PREFIX = "/api";

  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // Quiz routes (Student)
  app.use(`${API_PREFIX}/quizzes`, quizRoutes);

  // Progress tracking routes (Student)
  app.use(`${API_PREFIX}/progress`, progressRoutes);

  // Admin routes
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      status: "error",
      message: `Route ${req.originalUrl} not found`,
    });
  });
};
