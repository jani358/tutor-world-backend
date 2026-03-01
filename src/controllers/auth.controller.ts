import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../middlewares/errorHandler";

/**
 * Register new student user (US-021)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    status: "success",
    message: result.message,
    data: result.user,
  });
});

/**
 * Login user (US-001, US-002)
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * Google OAuth sign-in / registration.
 * Accepts a Google id_token from the NextAuth callback and returns app-issued JWT tokens.
 * @route POST /api/auth/google/callback
 */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ status: "error", message: "idToken is required" });
    return;
  }

  const result = await authService.googleSignIn(idToken);

  res.status(200).json({
    status: "success",
    message: "Google sign-in successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * Verify email with 6-digit code (US-022)
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const result = await authService.verifyEmail(email, code);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

/**
 * Resend email verification code
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.resendVerificationCode(email);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

/**
 * Forgot password — sends reset link to email
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

/**
 * Reset password with OTP code
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    const result = await authService.resetPassword(email, code, newPassword);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

/**
 * Change password for authenticated user
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.userId;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

/**
 * Create teacher account (admin only)
 */
export const createTeacher = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await authService.createTeacher(req.body);

    res.status(201).json({
      status: "success",
      message: result.message,
      data: result.user,
    });
  }
);

/**
 * Refresh access token using valid refresh token.
 * Returns new access + rotated refresh token.
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;

    const result = await authService.refreshAccessToken(token);

    res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }
);

/**
 * Logout user (US-003)
 * JWT invalidation is client-side; this endpoint confirms the action.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});
