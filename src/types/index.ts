import { Request } from "express";
import { Document, Types } from "mongoose";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SubmittedAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  timeSpent?: number;
}

export interface QuestionFilters {
  subject?: string;
  grade?: string;
  difficulty?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export type MongoDocument<T> = T &
  Document & {
    _id: Types.ObjectId;
  };
