import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import * as authValidation from "../validations/auth.validation";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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

router.post(
  "/register",
  authLimiter,
  validate(authValidation.registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(authValidation.loginSchema),
  authController.login
);

router.post(
  "/verify-email",
  otpLimiter,
  validate(authValidation.verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  otpLimiter,
  validate(authValidation.resendVerificationSchema),
  authController.resendVerification
);

router.post(
  "/forgot-password",
  otpLimiter,
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  otpLimiter,
  validate(authValidation.resetPasswordSchema),
  authController.resetPassword
);

router.post(
  "/refresh-token",
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

router.post(
  "/google/callback",
  authLimiter,
  validate(authValidation.googleCallbackSchema),
  authController.googleCallback
);

router.get("/me", authenticate, authController.getProfile);

router.put(
  "/profile",
  authenticate,
  validate(authValidation.updateProfileSchema),
  authController.updateProfile
);

router.post(
  "/change-password",
  authenticate,
  validate(authValidation.changePasswordSchema),
  authController.changePassword
);

router.post(
  "/create-teacher",
  authenticate,
  isAdmin,
  validate(authValidation.createTeacherSchema),
  authController.createTeacher
);

router.post("/logout", authController.logout);

export default router;
