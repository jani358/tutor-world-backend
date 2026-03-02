import mongoose, { Document, Schema } from "mongoose";

export type NotificationType = "info" | "warning" | "success" | "error";
export type NotificationTarget = "all" | "students" | "teachers" | "admins";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  notificationId: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  isRead: boolean;
  createdBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    notificationId: {
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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    target: {
      type: String,
      enum: ["all", "students", "teachers", "admins"],
      default: "all",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
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

notificationSchema.index({ target: 1, isDeleted: 1 });
notificationSchema.index({ createdBy: 1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
