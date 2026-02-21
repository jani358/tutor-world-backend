import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../middlewares/errorHandler";

/**
 * Register new user (US-021)
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
 * Verify email (US-022)
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
 * Resend verification code
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
 * Forgot password
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
 * Reset password
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  }
);

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
      },
    });
  }
);

/**
 * Logout user (US-003)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // For JWT, logout is handled on the client side by removing the token
  // Here we can add token to a blacklist if needed

  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});
