import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@dailysync/database';
import { HTTP_STATUS } from '@dailysync/config';
import { logger, logError } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, CustomError);
  }
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): CustomError => {
  return new CustomError(message, statusCode, code, details);
};

export const errorHandler = (
  error: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Handle different types of errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'CUSTOM_ERROR';
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case 'P2002':
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'A record with this data already exists';
        code = 'DUPLICATE_RECORD';
        details = { field: error.meta?.target };
        break;
      case 'P2025':
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = 'Record not found';
        code = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        code = 'FOREIGN_KEY_ERROR';
        break;
      default:
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        message = 'Database error';
        code = 'DATABASE_ERROR';
        details = { prismaCode: error.code };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = 'Database connection error';
    code = 'DATABASE_CONNECTION_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid JSON in request body';
    code = 'INVALID_JSON';
  }

  // Log the error
  logError(`${req.method} ${req.originalUrl}`, error, {
    statusCode,
    code,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
    details = undefined;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
export const notFoundError = (resource: string = 'Resource') => {
  return createError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

export const unauthorizedError = (message: string = 'Unauthorized') => {
  return createError(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
};

export const forbiddenError = (message: string = 'Forbidden') => {
  return createError(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
};

export const validationError = (message: string, details?: any) => {
  return createError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
};

export const conflictError = (message: string = 'Resource already exists') => {
  return createError(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
};

export const rateLimitError = (message: string = 'Too many requests') => {
  return createError(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMITED');
};
