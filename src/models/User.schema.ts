import mongoose, { Document, Schema } from "mongoose";

export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  isActive: boolean;
  grade?: string;
  school?: string;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpiry: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    grade: {
      type: String,
      trim: true,
    },
    school: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ role: 1 });

export default mongoose.model<IUser>("User", userSchema);
