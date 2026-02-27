import { Request } from "express";
import { Document, Types } from "mongoose";

/**
 * Authenticated request with user payload
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Standard API response shape
 */
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Quiz answer submitted by student
 */
export interface SubmittedAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  timeSpent?: number;
}

/**
 * Question filter parameters for admin
 */
export interface QuestionFilters {
  subject?: string;
  grade?: string;
  difficulty?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

/**
 * Generic MongoDB document with id field
 */
export type MongoDocument<T> = T &
  Document & {
    _id: Types.ObjectId;
  };
