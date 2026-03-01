import { v4 as uuidv4 } from "uuid";
import AuditLog, { AuditAction } from "../models/AuditLog.schema";
import mongoose from "mongoose";
import { logger } from "./logger";

interface AuditLogParams {
  action: AuditAction;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  changedBy: string | mongoose.Types.ObjectId;
  changes?: Array<{ field: string; oldValue?: any; newValue?: any }>;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export const logAudit = async (params: AuditLogParams): Promise<void> => {
  try {
    await AuditLog.create({
      logId: uuidv4(),
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      changedBy: params.changedBy,
      changes: params.changes || [],
      ipAddress: params.ipAddress,
      metadata: params.metadata,
    });
  } catch (error) {
    // Never throw from audit logging — log and continue
    logger.error("Failed to write audit log:", error);
  }
};

export const getAuditLogs = async (filters: {
  action?: string;
  targetType?: string;
  changedBy?: string;
  page?: number;
  limit?: number;
}) => {
  const { action, targetType, changedBy, page = 1, limit = 20 } = filters;

  const query: any = {};
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;
  if (changedBy) query.changedBy = changedBy;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate("changedBy", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  };
};
