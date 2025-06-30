import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RATE_LIMITS } from '@dailysync/config';
import { logger } from '../utils/logger';

// Default rate limiter
export const rateLimiter = rateLimit({
  windowMs: RATE_LIMITS.DEFAULT.WINDOW_MS,
  max: RATE_LIMITS.DEFAULT.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMITED',
    });
  },
});

// Auth-specific rate limiter (stricter)
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMITED',
    });
  },
});

// Webhook-specific rate limiter
export const webhookRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.WEBHOOK.WINDOW_MS,
  max: RATE_LIMITS.WEBHOOK.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many webhook requests, please try again later',
    code: 'WEBHOOK_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use webhook ID if available, otherwise fall back to IP
    const webhookId = req.params.id || req.params.webhookId;
    return webhookId ? `webhook:${webhookId}` : req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      webhookId: req.params.id || req.params.webhookId,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many webhook requests, please try again later',
      code: 'WEBHOOK_RATE_LIMITED',
    });
  },
});

// Create a custom rate limiter
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator,
    handler: (req: Request, res: Response) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        windowMs: options.windowMs,
        max: options.max,
      });
      
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
      });
    },
  });
};
