import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import "./connectMongoose";
import { corsOptions } from "./config/cors";
import { setupRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import { createAdminUser } from "./utils/seedAdmin";

const app: Application = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors(corsOptions));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Tutor World Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Setup routes
setupRoutes(app);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(port, async () => {
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

  // Create default admin user (runs after MongoDB connects)
  try {
    await createAdminUser();
  } catch (error) {
    logger.error("❌ Failed to seed admin user:", error);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

export default app;
