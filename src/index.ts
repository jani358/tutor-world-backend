import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import "dotenv/config";
import "./connectMongoose";
import mongoose from "mongoose";
import { corsOptions } from "./config/cors";
import { setupRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import { createAdminUser } from "./utils/seedAdmin";

const app: Application = express();
const port = process.env.PORT || 5001;

app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors(corsOptions));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Tutor World Backend is running",
    timestamp: new Date().toISOString(),
  });
});

setupRoutes(app);

app.use(errorHandler);

const server = app.listen(port, async () => {
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

  try {
    await createAdminUser();
  } catch (error) {
    logger.error("❌ Failed to seed admin user:", error);
  }
});

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed.");
    } catch (err) {
      logger.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => process.exit(1));
});

export default app;
