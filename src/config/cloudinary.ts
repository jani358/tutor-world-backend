import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const verifyCloudinaryConnection = async (): Promise<void> => {
  try {
    await cloudinary.api.ping();
    logger.info("Cloudinary connected successfully");
  } catch (error) {
    logger.error("Cloudinary connection failed:", error);
  }
};

export default cloudinary;
