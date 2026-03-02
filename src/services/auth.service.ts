import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import User, { IUser, UserRole } from "../models/User.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationCode,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail, sendTeacherInviteEmail } from "../utils/email";
import { AppError } from "../middlewares/errorHandler";

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  grade?: string;
  school?: string;
  dateOfBirth?: string;
}): Promise<{
  user: Partial<IUser>;
  message: string;
}> => {
  const existingEmail = await User.findOne({ email: data.email });
  if (existingEmail) {
    throw new AppError("User with this email already exists", 400);
  }

  const rawUsername = data.username || data.email.split("@")[0];
  const baseUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");

  let username = baseUsername;
  const collision = await User.findOne({ username });
  if (collision) {
    username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    userId: uuidv4(),
    username,
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

  await sendVerificationEmail(user.email, user.firstName, verificationCode);

  return {
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    message: "Registration successful. Please check your email for your verification code.",
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{
  user: Partial<IUser>;
  accessToken: string;
  refreshToken: string;
}> => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact administrator.", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

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
      username: user.username,
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

export const googleSignIn = async (idToken: string): Promise<{
  user: Partial<IUser>;
  accessToken: string;
  refreshToken: string;
}> => {
  const parts = idToken.split(".");
  if (parts.length < 2) throw new AppError("Invalid Google token", 400);

  let googlePayload: {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
  };

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    googlePayload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    throw new AppError("Failed to decode Google token", 400);
  }

  const { sub: googleId, email, given_name, family_name, name, picture } = googlePayload;

  if (!email) throw new AppError("Google account has no email address", 400);

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    const firstName = given_name || (name ? name.split(" ")[0] : "User");
    const lastName = family_name || (name ? name.split(" ").slice(1).join(" ") : "");

    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    let username = baseUsername;
    const collision = await User.findOne({ username });
    if (collision) {
      username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    user = await User.create({
      userId: uuidv4(),
      username,
      email,
      password: await bcrypt.hash(uuidv4(), 12),
      firstName,
      lastName,
      role: UserRole.STUDENT,
      googleId,
      avatar: picture,
      isEmailVerified: true,
      isActive: true,
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    if (!user.isActive) {
      throw new AppError("Your account has been deactivated. Please contact administrator.", 403);
    }
  }

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
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  };
};

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

  user.isEmailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiry = undefined;
  await user.save();

  return { message: "Email verified successfully. You can now log in." };
};

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

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiry = verificationCodeExpiry;
  await user.save();

  await sendVerificationEmail(user.email, user.firstName, verificationCode);

  return { message: "Verification code sent successfully" };
};

export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email });

  if (!user) {
    return { message: "If that email is registered, a reset code has been sent." };
  }

  const resetCode = generateVerificationCode();
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetPasswordToken = resetCode;
  user.resetPasswordExpiry = resetExpiry;
  await user.save();

  await sendPasswordResetEmail(user.email, user.firstName, resetCode);

  return { message: "If that email is registered, a reset code has been sent." };
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpiry");

  if (!user || !user.resetPasswordToken || user.resetPasswordToken !== code) {
    throw new AppError("Invalid or expired reset code", 400);
  }

  if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return { message: "Password reset successfully. You can now log in." };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const user = await User.findOne({ userId }).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.password) {
    throw new AppError("Password change not available for OAuth accounts", 400);
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { message: "Password changed successfully." };
};

export const createTeacher = async (data: {
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
}): Promise<{ user: Partial<IUser>; message: string }> => {
  const existingEmail = await User.findOne({ email: data.email });
  if (existingEmail) {
    throw new AppError("User with this email already exists", 400);
  }

  const rawUsername = data.username || data.email.split("@")[0];
  const baseUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
  let username = baseUsername;
  const collision = await User.findOne({ username });
  if (collision) {
    username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const tempPassword = `Tutor@${Math.floor(100000 + Math.random() * 900000)}`;
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    userId: uuidv4(),
    username,
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    role: UserRole.TEACHER,
    isEmailVerified: true,
    isActive: true,
  });

  await sendTeacherInviteEmail(user.email, user.firstName, tempPassword);

  return {
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    message: "Teacher account created. Login credentials sent to their email.",
  };
};

export const getProfile = async (
  userId: string
): Promise<Partial<IUser>> => {
  const user = await User.findOne({ userId, isActive: true });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    grade: user.grade,
    school: user.school,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt,
  };
};

export const updateProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string }
): Promise<{ user: Partial<IUser>; message: string }> => {
  const user = await User.findOne({ userId, isActive: true });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const changes: Array<{ field: string; oldValue?: string; newValue?: string }> = [];

  if (data.firstName && data.firstName !== user.firstName) {
    changes.push({ field: "firstName", oldValue: user.firstName, newValue: data.firstName });
    user.firstName = data.firstName;
  }
  if (data.lastName && data.lastName !== user.lastName) {
    changes.push({ field: "lastName", oldValue: user.lastName, newValue: data.lastName });
    user.lastName = data.lastName;
  }
  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new AppError("Email is already in use by another account", 400);
    }
    changes.push({ field: "email", oldValue: user.email, newValue: data.email });
    user.email = data.email;
  }

  if (changes.length === 0) {
    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      message: "No changes detected.",
    };
  }

  await user.save();

  return {
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
    },
    message: "Profile updated successfully.",
  };
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findOne({ userId: decoded.userId, isActive: true });
  if (!user) {
    throw new AppError("User not found or account inactive", 401);
  }

  const tokenPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
