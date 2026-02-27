/**
 * Application-wide constants
 */

export const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] as const;

export const SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "History",
  "Geography",
  "Art",
  "Music",
  "Computing",
  "Physical Education",
] as const;

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer"] as const;

export const QUIZ_STATUSES = ["draft", "active", "archived"] as const;

export const TOKEN_EXPIRY = {
  ACCESS: process.env.JWT_EXPIRE || "24h",
  REFRESH: process.env.JWT_REFRESH_EXPIRE || "7d",
  RESET_PASSWORD: "1h",
  VERIFICATION_CODE: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

export const PASSWORD_SALT_ROUNDS = 12;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
