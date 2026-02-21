import mongoose, { Document, Schema } from "mongoose";

export enum QuestionDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
}

export interface IOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  questionId: string;
  title: string;
  description?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  subject: string;
  grade: string;
  options: IOption[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  isActive: boolean;
  tags: string[];
  imageUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionDifficulty),
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    correctAnswer: {
      type: String,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
questionSchema.index({ subject: 1, grade: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ tags: 1 });

export default mongoose.model<IQuestion>("Question", questionSchema);
