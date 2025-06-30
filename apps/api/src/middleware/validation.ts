import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema, ZodError } from 'zod'
import { validationError } from './errorHandler'

// Generic validation middleware
export const validate = (schema: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        
        next(validationError('Validation failed', errorMessages))
      } else {
        next(error)
      }
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  }),

  // ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
}

// Daily report validation schemas
export const dailyReportSchemas = {
  create: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    ticketsResolved: z.number().int().min(0, 'Tickets resolved must be non-negative'),
    chatsHandled: z.number().int().min(0, 'Chats handled must be non-negative'),
    githubIssues: z.number().int().min(0, 'GitHub issues must be non-negative'),
    emailsProcessed: z.number().int().min(0, 'Emails processed must be non-negative'),
    callsAttended: z.number().int().min(0, 'Calls attended must be non-negative'),
    notes: z.string().optional(),
    links: z.array(z.string().url('Invalid URL format')).optional(),
  }),

  update: z.object({
    ticketsResolved: z.number().int().min(0).optional(),
    chatsHandled: z.number().int().min(0).optional(),
    githubIssues: z.number().int().min(0).optional(),
    emailsProcessed: z.number().int().min(0).optional(),
    callsAttended: z.number().int().min(0).optional(),
    notes: z.string().optional(),
    links: z.array(z.string().url()).optional(),
  }),
}

// Meeting report validation schemas
export const meetingReportSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    startTime: z.string().datetime('Invalid start time format'),
    endTime: z.string().datetime('Invalid end time format').optional(),
    outcome: z.enum(['SUCCESSFUL', 'CANCELLED', 'RESCHEDULED', 'PENDING']),
    notes: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    actionItems: z.array(z.string()).optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    outcome: z.enum(['SUCCESSFUL', 'CANCELLED', 'RESCHEDULED', 'PENDING']).optional(),
    notes: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    actionItems: z.array(z.string()).optional(),
  }),
}

// Webhook validation schemas
export const webhookSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().optional(),
    secret: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    secret: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),

  endpoint: z.object({
    url: z.string().url('Invalid URL format'),
    method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
    headers: z.record(z.string()).optional(),
    template: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
}

// User validation schemas
export const userSchemas = {
  register: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  updateProfile: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),

  updateUser: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
  }),
}

// Analytics validation schemas
export const analyticsSchemas = {
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  }),

  export: z.object({
    format: z.enum(['json', 'csv']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
}

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Sanitization middleware
export const sanitizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  
  next()
}

// File upload validation
export const validateFileUpload = (options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  required?: boolean
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file
    
    if (!file && options.required) {
      return next(validationError('File is required'))
    }
    
    if (file) {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return next(validationError(`File size must be less than ${options.maxSize} bytes`))
      }
      
      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        return next(validationError(`File type must be one of: ${options.allowedTypes.join(', ')}`))
      }
    }
    
    next()
  }
}
