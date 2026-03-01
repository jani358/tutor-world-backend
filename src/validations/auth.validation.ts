import Joi from "joi";

// Password must contain: 1 uppercase, 1 lowercase, 1 number, 1 special character, min 8 chars
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).{8,}$/;
const PASSWORD_MESSAGE =
  "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character";

const strongPassword = Joi.string()
  .min(8)
  .pattern(PASSWORD_PATTERN)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": PASSWORD_MESSAGE,
    "any.required": "Password is required",
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: strongPassword,
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name must not exceed 50 characters",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name must not exceed 50 characters",
    "any.required": "Last name is required",
  }),
  username: Joi.string().alphanum().min(3).max(30).lowercase().optional().messages({
    "string.alphanum": "Username may only contain letters and numbers",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must not exceed 30 characters",
  }),
  grade: Joi.string().optional(),
  school: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required().messages({
    "string.length": "Verification code must be 6 digits",
    "any.required": "Verification code is required",
  }),
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
  }),
  code: Joi.string().length(6).required().messages({
    "string.length": "Reset code must be 6 digits",
    "any.required": "Reset code is required",
  }),
  newPassword: strongPassword.messages({
    "any.required": "New password is required",
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: strongPassword.messages({
    "any.required": "New password is required",
  }),
});

export const createTeacherSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    "any.required": "First name is required",
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "any.required": "Last name is required",
  }),
  username: Joi.string().alphanum().min(3).max(30).lowercase().optional(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const googleCallbackSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "any.required": "Google id_token is required",
  }),
});
