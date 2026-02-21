import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import * as authValidation from "../validations/auth.validation";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new student account (US-021)
 * @access  Public
 */
router.post(
  "/register",
  validate(authValidation.registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (US-001, US-002)
 * @access  Public
 */
router.post(
  "/login",
  validate(authValidation.loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with code (US-022)
 * @access  Public
 */
router.post(
  "/verify-email",
  validate(authValidation.verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification code
 * @access  Public
 */
router.post(
  "/resend-verification",
  validate(authValidation.resendVerificationSchema),
  authController.resendVerification
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(authValidation.resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh-token",
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (US-003)
 * @access  Public
 */
router.post("/logout", authController.logout);

export default router;
