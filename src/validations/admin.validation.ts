import Joi from "joi";

/**
 * Validation schemas for question management
 */
export const createQuestionSchema = Joi.object({
  title: Joi.string().min(5).max(500).required().messages({
    "string.min": "Question title must be at least 5 characters",
    "string.max": "Question title must not exceed 500 characters",
    "any.required": "Question title is required",
  }),
  description: Joi.string().max(1000).optional(),
  questionType: Joi.string()
    .valid("multiple_choice", "true_false", "short_answer")
    .required()
    .messages({
      "any.only": "Question type must be multiple_choice, true_false, or short_answer",
      "any.required": "Question type is required",
    }),
  difficulty: Joi.string().valid("easy", "medium", "hard").required().messages({
    "any.only": "Difficulty must be easy, medium, or hard",
    "any.required": "Difficulty is required",
  }),
  subject: Joi.string().min(2).max(100).required().messages({
    "any.required": "Subject is required",
  }),
  grade: Joi.string().min(1).max(20).required().messages({
    "any.required": "Grade is required",
  }),
  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().required(),
        isCorrect: Joi.boolean().required(),
      })
    )
    .min(2)
    .when("questionType", {
      is: "short_answer",
      then: Joi.array().optional(),
      otherwise: Joi.array().min(2).required(),
    }),
  correctAnswer: Joi.string().when("questionType", {
    is: "short_answer",
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  explanation: Joi.string().max(1000).optional(),
  points: Joi.number().integer().min(1).max(100).default(1),
  tags: Joi.array().items(Joi.string()).optional(),
  imageUrl: Joi.string().uri().optional(),
});

export const updateQuestionSchema = Joi.object({
  title: Joi.string().min(5).max(500).optional(),
  description: Joi.string().max(1000).optional(),
  difficulty: Joi.string().valid("easy", "medium", "hard").optional(),
  subject: Joi.string().min(2).max(100).optional(),
  grade: Joi.string().min(1).max(20).optional(),
  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().required(),
        isCorrect: Joi.boolean().required(),
      })
    )
    .optional(),
  correctAnswer: Joi.string().optional(),
  explanation: Joi.string().max(1000).optional(),
  points: Joi.number().integer().min(1).max(100).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  imageUrl: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * Validation schemas for quiz management
 */
export const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "any.required": "Quiz title is required",
  }),
  description: Joi.string().max(1000).optional(),
  subject: Joi.string().min(2).max(100).required().messages({
    "any.required": "Subject is required",
  }),
  grade: Joi.string().min(1).max(20).required().messages({
    "any.required": "Grade is required",
  }),
  timeLimit: Joi.number().integer().min(0).optional(),
  passingScore: Joi.number().min(0).max(100).default(60),
  questions: Joi.array().items(Joi.string()).min(1).required().messages({
    "any.required": "At least one question is required",
  }),
  isRandomized: Joi.boolean().default(false),
  numberOfQuestions: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid("draft", "active", "archived").default("draft"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  instructions: Joi.string().max(2000).optional(),
  imageUrl: Joi.string().uri().optional(),
});

export const updateQuizSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  subject: Joi.string().min(2).max(100).optional(),
  grade: Joi.string().min(1).max(20).optional(),
  timeLimit: Joi.number().integer().min(0).optional(),
  passingScore: Joi.number().min(0).max(100).optional(),
  questions: Joi.array().items(Joi.string()).min(1).optional(),
  isRandomized: Joi.boolean().optional(),
  numberOfQuestions: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid("draft", "active", "archived").optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  instructions: Joi.string().max(2000).optional(),
  imageUrl: Joi.string().uri().optional(),
});

export const assignQuizSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string()).min(1).required().messages({
    "any.required": "At least one student ID is required",
  }),
});
