import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import * as authValidation from "../validations/auth.validation";

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    status: "error",
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new student account (US-021)
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
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
  authLimiter,
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
  otpLimiter,
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
  otpLimiter,
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
  otpLimiter,
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
  otpLimiter,
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
 * @route   POST /api/auth/google/callback
 * @desc    Exchange Google id_token (from NextAuth) for app-issued JWT tokens
 * @access  Public
 */
router.post(
  "/google/callback",
  authLimiter,
  validate(authValidation.googleCallbackSchema),
  authController.googleCallback
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticate,
  validate(authValidation.updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  validate(authValidation.changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/auth/create-teacher
 * @desc    Admin creates a teacher account (sends invite email)
 * @access  Private (Admin only)
 */
router.post(
  "/create-teacher",
  authenticate,
  isAdmin,
  validate(authValidation.createTeacherSchema),
  authController.createTeacher
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (US-003)
 * @access  Public
 */
router.post("/logout", authController.logout);

export default router;
