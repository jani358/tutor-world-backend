import mongoose, { Document, Schema } from "mongoose";

export enum GroupColor {
  PRIMARY = "primary",
  SUCCESS = "success",
  WARNING = "warning",
  ACCENT = "accent",
  INFO = "info",
  ERROR = "error",
}

export interface IStudentGroup extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: string;
  name: string;
  description: string;
  students: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  color: GroupColor;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentGroupSchema = new Schema<IStudentGroup>(
  {
    groupId: {
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
    description: {
      type: String,
      trim: true,
      default: "",
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    color: {
      type: String,
      enum: Object.values(GroupColor),
      default: GroupColor.PRIMARY,
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

studentGroupSchema.index({ createdBy: 1 });
studentGroupSchema.index({ students: 1 });

export default mongoose.model<IStudentGroup>("StudentGroup", studentGroupSchema);
