import mongoose, { Document, Schema } from "mongoose";

export type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "LOGIN"
  | "LOGOUT"
  | "STATUS_CHANGE"
  | "ASSIGNED";

export interface IAuditLog extends Document {
  logId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  changedBy: mongoose.Types.ObjectId;
  changes: Array<{
    field: string;
    oldValue?: any;
    newValue?: any;
  }>;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "CREATED",
        "UPDATED",
        "DELETED",
        "LOGIN",
        "LOGOUT",
        "STATUS_CHANGE",
        "ASSIGNED",
      ],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    targetLabel: {
      type: String,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changes: [
      {
        field: { type: String },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
    ipAddress: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ changedBy: 1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
