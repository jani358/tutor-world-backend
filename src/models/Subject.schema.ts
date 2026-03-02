import mongoose, { Document, Schema } from "mongoose";

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  subjectId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
  status: "active" | "inactive";
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    subjectId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    icon: {
      type: String,
      default: "BookOpen",
    },
    color: {
      type: String,
      default: "#44A194",
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ slug: 1, isDeleted: 1 });
subjectSchema.index({ status: 1, isDeleted: 1 });

export default mongoose.model<ISubject>("Subject", subjectSchema);
