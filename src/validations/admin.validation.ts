import Joi from "joi";

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

export const createStudentGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Group name must be at least 2 characters",
    "string.max": "Group name must not exceed 100 characters",
    "any.required": "Group name is required",
  }),
  description: Joi.string().max(500).optional().allow(""),
  studentIds: Joi.array().items(Joi.string()).optional().default([]),
  color: Joi.string()
    .valid("primary", "success", "warning", "accent", "info", "error")
    .default("primary"),
});

export const updateStudentGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(""),
  studentIds: Joi.array().items(Joi.string()).optional(),
  color: Joi.string()
    .valid("primary", "success", "warning", "accent", "info", "error")
    .optional(),
});

export const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Class name must be at least 2 characters",
    "string.max": "Class name must not exceed 100 characters",
    "any.required": "Class name is required",
  }),
  description: Joi.string().max(500).optional().allow(""),
  teacherId: Joi.string().optional(),
});

export const updateClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(""),
  status: Joi.string().valid("active", "inactive").optional(),
});

export const assignTeacherSchema = Joi.object({
  teacherId: Joi.string().required().messages({
    "any.required": "Teacher ID is required",
  }),
});

export const assignStudentClassSchema = Joi.object({
  classId: Joi.string().required().messages({
    "any.required": "Class ID is required",
  }),
});

export const createSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Subject name must be at least 2 characters",
    "string.max": "Subject name must not exceed 100 characters",
    "any.required": "Subject name is required",
  }),
  description: Joi.string().max(500).optional().allow(""),
  icon: Joi.string().max(50).optional(),
  color: Joi.string().max(20).optional(),
});

export const updateSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(""),
  icon: Joi.string().max(50).optional(),
  color: Joi.string().max(20).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

export const createNotificationSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.min": "Title must be at least 3 characters",
    "any.required": "Notification title is required",
  }),
  message: Joi.string().min(5).max(2000).required().messages({
    "string.min": "Message must be at least 5 characters",
    "any.required": "Notification message is required",
  }),
  type: Joi.string().valid("info", "warning", "success", "error").optional(),
  target: Joi.string().valid("all", "students", "teachers", "admins").optional(),
  expiresAt: Joi.date().optional(),
});
