import { Application } from "express";
import authRoutes from "./auth.routes";
import quizRoutes from "./quiz.routes";
import adminRoutes from "./admin.routes";
import teacherRoutes from "./teacher.routes";
import progressRoutes from "./progress.routes";

export const setupRoutes = (app: Application): void => {
  const API_PREFIX = "/api";

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/quizzes`, quizRoutes);
  app.use(`${API_PREFIX}/progress`, progressRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  app.use(`${API_PREFIX}/teacher`, teacherRoutes);

  app.use("*", (req, res) => {
    res.status(404).json({
      status: "error",
      message: `Route ${req.originalUrl} not found`,
    });
  });
};
