import mongoose, { Document, Schema } from "mongoose";

export enum QuizStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  timeLimit?: number; // in minutes
  totalPoints: number;
  passingScore: number;
  questions: mongoose.Types.ObjectId[];
  isRandomized: boolean;
  numberOfQuestions?: number; // if randomized, how many questions to show
  assignedTo: mongoose.Types.ObjectId[]; // student IDs
  status: QuizStatus;
  startDate?: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  imageUrl?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    quizId: {
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
    timeLimit: {
      type: Number,
      min: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 60,
      min: 0,
      max: 100,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    isRandomized: {
      type: Boolean,
      default: false,
    },
    numberOfQuestions: {
      type: Number,
      min: 1,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: Object.values(QuizStatus),
      default: QuizStatus.DRAFT,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quizSchema.index({ subject: 1, grade: 1 });
quizSchema.index({ status: 1 });
quizSchema.index({ assignedTo: 1 });

export default mongoose.model<IQuiz>("Quiz", quizSchema);
