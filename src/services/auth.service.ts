import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User, { IUser, UserRole } from "../models/User.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationCode,
  generateResetToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { AppError } from "../middlewares/errorHandler";

/**
 * Register a new user (US-021)
 */
export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  grade?: string;
  school?: string;
  dateOfBirth?: string;
}): Promise<{
  user: Partial<IUser>;
  message: string;
}> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Generate verification code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await User.create({
    userId: uuidv4(),
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    role: UserRole.STUDENT,
    grade: data.grade,
    school: data.school,
    dateOfBirth: data.dateOfBirth,
    verificationCode,
    verificationCodeExpiry,
    isEmailVerified: false,
  });

  // Send verification email (US-022)
  await sendVerificationEmail(user.email, user.firstName, verificationCode);

  return {
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    message: "Registration successful. Please check your email for verification code.",
  };
};

/**
 * Login user (US-001, US-002)
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{
  user: Partial<IUser>;
  accessToken: string;
  refreshToken: string;
}> => {
  // Find user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user is active (US-027)
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact administrator.", 403);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      grade: user.grade,
      school: user.school,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Verify email with code (US-022)
 */
export const verifyEmail = async (
  email: string,
  code: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email }).select(
    "+verificationCode +verificationCodeExpiry"
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  if (
    !user.verificationCode ||
    !user.verificationCodeExpiry ||
    user.verificationCode !== code
  ) {
    throw new AppError("Invalid verification code", 400);
  }

  if (user.verificationCodeExpiry < new Date()) {
    throw new AppError("Verification code has expired", 400);
  }

  // Update user
  user.isEmailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiry = undefined;
  await user.save();

  return { message: "Email verified successfully" };
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (
  email: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate new code
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiry = verificationCodeExpiry;
  await user.save();

  // Send email
  await sendVerificationEmail(user.email, user.firstName, verificationCode);

  return { message: "Verification code sent successfully" };
};

/**
 * Forgot password - send reset link
 */
export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists
    return { message: "If the email exists, a reset link has been sent" };
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiry = resetTokenExpiry;
  await user.save();

  // Send email
  await sendPasswordResetEmail(user.email, user.firstName, resetToken);

  return { message: "If the email exists, a reset link has been sent" };
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return { message: "Password reset successfully" };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await User.findOne({ userId: decoded.userId, isActive: true });
    if (!user) {
      throw new AppError("User not found or inactive", 401);
    }

    const newAccessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }
};
