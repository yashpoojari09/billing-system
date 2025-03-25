import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger"; // Import Logger

// Custom Error Class
class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global Error Handler
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  if (!statusCode) statusCode = 500;
  if (!message) message = "Internal Server Error";

  // Log the error
  logger.error(`🔥 ERROR: ${message} - ${req.method} ${req.url}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { AppError, errorHandler };
