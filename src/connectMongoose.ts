import mongoose from "mongoose";
import { logger } from "./utils/logger";

const mongooseConnectStart = Date.now();

export const mongooseConnectPromise = mongoose
  .connect(process.env.MONGODB_URI!, {})
  .then(() => {
    logger.info(`✅ MongoDB connected in ${Date.now() - mongooseConnectStart}ms`);
    return { success: `MongoDB connected in ${Date.now() - mongooseConnectStart}ms` };
  })
  .catch((err) => {
    logger.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

export default mongoose;
