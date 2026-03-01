import mongoose, { Document, Schema } from "mongoose";

export enum AttemptStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent?: number;
}

export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  attemptId: string;
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  percentage: number;
  totalPoints: number;
  status: AttemptStatus;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number;
  isPassed: boolean;
  isLateSubmission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    attemptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selectedAnswer: {
          type: Schema.Types.Mixed,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        pointsEarned: {
          type: Number,
          required: true,
          default: 0,
        },
        timeSpent: {
          type: Number,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.IN_PROGRESS,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    isLateSubmission: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

quizAttemptSchema.index({ studentId: 1, quizId: 1 });
quizAttemptSchema.index({ status: 1 });
quizAttemptSchema.index({ completedAt: -1 });

export default mongoose.model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
