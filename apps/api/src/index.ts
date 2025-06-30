import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from '@dailysync/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { routes } from './routes';
import { initializeQueues } from './services/queue';
import { deliveryMonitor } from './services/deliveryMonitor';
import { prisma } from '@dailysync/database';

const app = express();
const PORT = env.API_PORT || 3001;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [env.NEXTAUTH_URL] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');
    
    // Stop delivery monitor
    deliveryMonitor.stop();
    logger.info('Delivery monitor stopped');

    // Close Redis connections and queues
    // This will be implemented when we add queue services
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    logger.info('Starting DailySync API Server...');

    // Try database connection (optional for demo)
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (dbError) {
      logger.warn('⚠️ Database connection failed - running in demo mode');
      logger.warn('Database error:', dbError);
    }

    // Try to initialize queues (optional for demo)
    try {
      await initializeQueues();
      logger.info('✅ Queues initialized successfully');
    } catch (queueError) {
      logger.warn('⚠️ Queue initialization failed - running without background jobs');
      logger.warn('Queue error:', queueError);
    }

    // Try to start delivery monitoring (optional for demo)
    try {
      deliveryMonitor.start();
      logger.info('✅ Delivery monitor started');
    } catch (monitorError) {
      logger.warn('⚠️ Delivery monitor failed - running without monitoring');
      logger.warn('Monitor error:', monitorError);
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 DailySync API Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
