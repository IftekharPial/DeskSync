import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, excludePassword } from '@dailysync/database';
import { env, ExtendedUser } from '@dailysync/config';
import { unauthorizedError, forbiddenError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: ExtendedUser;
    }
  }
}

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw unauthorizedError('Invalid or expired token');
  }
};

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// Authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw unauthorizedError('Authentication token required');
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw unauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw unauthorizedError('User account is inactive');
    }

    // Add user to request (excluding password)
    req.user = excludePassword(user) as ExtendedUser;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (user && user.isActive) {
        req.user = excludePassword(user) as ExtendedUser;
      }
    }
    
    next();
  } catch (error) {
    // Don't throw error for optional auth, just continue without user
    logger.warn('Optional auth failed:', error);
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorizedError('Authentication required'));
    }

    // Admin has access to everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check specific role
    if (req.user.role !== requiredRole) {
      return next(forbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole('ADMIN');

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (options: {
  windowMs: number
  maxRequests: number
  message?: string
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown'
    const now = Date.now()

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k)
      }
    }

    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // Create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return next()
    }

    if (record.count >= options.maxRequests) {
      return res.status(429).json({
        success: false,
        error: options.message || 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      })
    }

    // Increment count
    record.count++
    next()
  }
}

// API key authentication for webhooks
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string

    if (!apiKey) {
      throw unauthorizedError('API key required')
    }

    // In a real implementation, you'd validate the API key against your database
    // For now, we'll use a simple check
    if (apiKey !== env.WEBHOOK_API_KEY) {
      throw unauthorizedError('Invalid API key')
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Webhook signature verification
export const verifyWebhookSignature = (secret?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!secret) {
      return next() // No signature verification if no secret provided
    }

    const signature = req.headers['x-webhook-signature'] as string

    if (!signature) {
      throw unauthorizedError('Webhook signature required')
    }

    // In a real implementation, you'd verify the HMAC signature
    // This is a simplified version
    const expectedSignature = `sha256=${secret}`

    if (signature !== expectedSignature) {
      throw unauthorizedError('Invalid webhook signature')
    }

    next()
  }
}

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Webhook-Signature')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

// Support agent middleware
export const requireSupportAgent = requireRole('SUPPORT_AGENT');

// Resource ownership middleware
export const requireOwnership = (getUserIdFromParams: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorizedError('Authentication required'));
    }

    // Admin can access all resources
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const resourceUserId = getUserIdFromParams(req);
    
    if (req.user.id !== resourceUserId) {
      return next(forbiddenError('Access denied: You can only access your own resources'));
    }

    next();
  };
};

// Middleware to check if user can access a specific user's resources
export const canAccessUserResources = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(unauthorizedError('Authentication required'));
  }

  // Admin can access all user resources
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Support agents can only access their own resources
  const targetUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (targetUserId && req.user.id !== targetUserId) {
    return next(forbiddenError('Access denied: You can only access your own resources'));
  }

  next();
};

// Webhook authentication middleware (for external webhook calls)
export const webhookAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookId = req.params.id;
    
    if (!webhookId) {
      throw unauthorizedError('Webhook ID required');
    }

    // Get webhook from database
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw unauthorizedError('Webhook not found');
    }

    if (webhook.status !== 'ACTIVE') {
      throw unauthorizedError('Webhook is not active');
    }

    // If webhook has a secret, verify it
    if (webhook.secret) {
      const providedSecret = req.headers['x-webhook-secret'] as string;
      
      if (!providedSecret || providedSecret !== webhook.secret) {
        throw unauthorizedError('Invalid webhook secret');
      }
    }

    // Add webhook to request for later use
    (req as any).webhook = webhook;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Generate JWT token
export const generateToken = (user: ExtendedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
