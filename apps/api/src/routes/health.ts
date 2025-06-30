import { Router } from 'express';
import { prisma } from '@dailysync/database';
import { getQueueStats } from '../services/queue';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    },
  });
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database connection
  let databaseStatus = 'healthy';
  let databaseResponseTime = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseResponseTime = Date.now() - dbStart;
  } catch (error) {
    databaseStatus = 'unhealthy';
  }

  // Check queue status
  let queueStatus = 'healthy';
  let queueStats = null;
  try {
    queueStats = await getQueueStats();
  } catch (error) {
    queueStatus = 'unhealthy';
  }

  const totalResponseTime = Date.now() - startTime;

  res.json({
    success: true,
    data: {
      status: databaseStatus === 'healthy' && queueStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: `${totalResponseTime}ms`,
      services: {
        database: {
          status: databaseStatus,
          responseTime: `${databaseResponseTime}ms`,
        },
        queues: {
          status: queueStatus,
          stats: queueStats,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    },
  });
}));

export { router as healthRoutes };
