import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../middlewares/errorHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    status: "success",
    message: result.message,
    data: result.user,
  });
});

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

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const result = await authService.verifyEmail(email, code);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

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

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    const user = await authService.getProfile(userId);

    res.status(200).json({
      status: "success",
      data: user,
    });
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    const result = await authService.updateProfile(userId, req.body);

    res.status(200).json({
      status: "success",
      message: result.message,
      data: result.user,
    });
  }
);

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

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});
