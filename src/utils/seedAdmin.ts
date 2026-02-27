import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User, { UserRole } from "../models/User.schema";
import { logger } from "./logger";

/**
 * Create default admin user if not exists
 */
export const createAdminUser = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@tutorworld.com";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      logger.info("Admin user already exists");
      return;
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await User.create({
      userId: uuidv4(),
      username: "admin",
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    logger.info(`✅ Admin user created with email: ${adminEmail}`);
    logger.info(`   Default password: ${adminPassword}`);
    logger.warn("⚠️  Please change the admin password after first login!");
  } catch (error) {
    logger.error("Failed to create admin user:", error);
  }
};
