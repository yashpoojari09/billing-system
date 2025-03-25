"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../utils/logger")); // Import Logger
// Custom Error Class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Global Error Handler
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (!statusCode)
        statusCode = 500;
    if (!message)
        message = "Internal Server Error";
    // Log the error
    logger_1.default.error(`🔥 ERROR: ${message} - ${req.method} ${req.url}`);
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
