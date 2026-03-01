import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { UserRole } from "../models/User.schema";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      status: "error",
      message: error.message || "Invalid token",
    });
  }
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      status: "error",
      message: "Admin access required",
    });
    return;
  }

  next();
};

export const isTeacher = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== UserRole.TEACHER) {
    res.status(403).json({
      status: "error",
      message: "Teacher access required",
    });
    return;
  }

  next();
};

export const isStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== UserRole.STUDENT) {
    res.status(403).json({
      status: "error",
      message: "Student access required",
    });
    return;
  }

  next();
};

export const isAdminOrTeacher = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: "error",
      message: "Authentication required",
    });
    return;
  }

  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.TEACHER
  ) {
    res.status(403).json({
      status: "error",
      message: "Admin or teacher access required",
    });
    return;
  }

  next();
};
