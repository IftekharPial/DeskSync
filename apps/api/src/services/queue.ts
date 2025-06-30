import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env, QUEUE_NAMES } from '@dailysync/config';
import { logger } from '../utils/logger';

// Redis connection
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Queue instances
export const webhookDeliveryQueue = new Queue(QUEUE_NAMES.WEBHOOK_DELIVERY, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const emailNotificationQueue = new Queue(QUEUE_NAMES.EMAIL_NOTIFICATIONS, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const analyticsProcessingQueue = new Queue(QUEUE_NAMES.ANALYTICS_PROCESSING, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

// Import processors
import { webhookDeliveryService } from './webhookDelivery';
import { prisma } from '@dailysync/database';

// Job processors
let webhookWorker: Worker;
let emailWorker: Worker;
let analyticsWorker: Worker;

// Initialize queues and workers
export const initializeQueues = async () => {
  try {
    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established');

    // Initialize webhook delivery worker
    webhookWorker = new Worker(
      QUEUE_NAMES.WEBHOOK_DELIVERY,
      async (job: Job) => {
        logger.info(`Processing webhook delivery job: ${job.id}`, {
          jobData: job.data,
          attempt: job.attemptsMade + 1,
        });

        return await webhookDeliveryService.processDeliveryJob(job);
      },
      {
        connection: redis,
        concurrency: 5,
      }
    );

    emailWorker = new Worker(
      QUEUE_NAMES.EMAIL_NOTIFICATIONS,
      async (job: Job) => {
        // Email notification processor will be implemented
        logger.info(`Processing email notification job: ${job.id}`);
        return { success: true };
      },
      {
        connection: redis,
        concurrency: 3,
      }
    );

    analyticsWorker = new Worker(
      QUEUE_NAMES.ANALYTICS_PROCESSING,
      async (job: Job) => {
        logger.info(`Processing analytics job: ${job.id}`, {
          jobData: job.data,
          attempt: job.attemptsMade + 1,
        });

        const { type, userId, date } = job.data;

        switch (type) {
          case 'daily_summary':
            return await processDailySummary(userId, date);
          case 'weekly_report':
            return await processWeeklyReport(userId, date);
          case 'monthly_report':
            return await processMonthlyReport(userId, date);
          default:
            throw new Error(`Unknown analytics job type: ${type}`);
        }
      },
      {
        connection: redis,
        concurrency: 2,
      }
    );

    // Set up event listeners
    setupQueueEventListeners();

    logger.info('All queues and workers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues:', error);
    throw error;
  }
};

// Set up event listeners for monitoring
const setupQueueEventListeners = () => {
  // Webhook delivery queue events
  webhookDeliveryQueue.on('completed', (job) => {
    logger.info(`Webhook delivery job completed: ${job.id}`);
  });

  webhookDeliveryQueue.on('failed', (job, err) => {
    logger.error(`Webhook delivery job failed: ${job?.id}`, err);
  });

  // Email notification queue events
  emailNotificationQueue.on('completed', (job) => {
    logger.info(`Email notification job completed: ${job.id}`);
  });

  emailNotificationQueue.on('failed', (job, err) => {
    logger.error(`Email notification job failed: ${job?.id}`, err);
  });

  // Analytics processing queue events
  analyticsProcessingQueue.on('completed', (job) => {
    logger.info(`Analytics processing job completed: ${job.id}`);
  });

  analyticsProcessingQueue.on('failed', (job, err) => {
    logger.error(`Analytics processing job failed: ${job?.id}`, err);
  });

  // Worker events
  if (webhookWorker) {
    webhookWorker.on('completed', (job) => {
      logger.debug(`Webhook worker completed job: ${job.id}`);
    });

    webhookWorker.on('failed', (job, err) => {
      logger.error(`Webhook worker failed job: ${job?.id}`, err);
    });
  }

  if (emailWorker) {
    emailWorker.on('completed', (job) => {
      logger.debug(`Email worker completed job: ${job.id}`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`Email worker failed job: ${job?.id}`, err);
    });
  }

  if (analyticsWorker) {
    analyticsWorker.on('completed', (job) => {
      logger.debug(`Analytics worker completed job: ${job.id}`);
    });

    analyticsWorker.on('failed', (job, err) => {
      logger.error(`Analytics worker failed job: ${job?.id}`, err);
    });
  }
};

// Helper functions to add jobs to queues
export const addWebhookDeliveryJob = async (data: any, options?: any) => {
  return webhookDeliveryQueue.add('deliver-webhook', data, options);
};

export const addEmailNotificationJob = async (data: any, options?: any) => {
  return emailNotificationQueue.add('send-email', data, options);
};

export const addAnalyticsProcessingJob = async (data: any, options?: any) => {
  return analyticsProcessingQueue.add('process-analytics', data, options);
};

// Get queue statistics
export const getQueueStats = async () => {
  const [webhookStats, emailStats, analyticsStats] = await Promise.all([
    webhookDeliveryQueue.getJobCounts(),
    emailNotificationQueue.getJobCounts(),
    analyticsProcessingQueue.getJobCounts(),
  ]);

  return {
    webhookDelivery: webhookStats,
    emailNotifications: emailStats,
    analyticsProcessing: analyticsStats,
  };
};

// Graceful shutdown
export const closeQueues = async () => {
  logger.info('Closing queues and workers...');

  const closePromises = [];

  if (webhookWorker) {
    closePromises.push(webhookWorker.close());
  }
  if (emailWorker) {
    closePromises.push(emailWorker.close());
  }
  if (analyticsWorker) {
    closePromises.push(analyticsWorker.close());
  }

  closePromises.push(webhookDeliveryQueue.close());
  closePromises.push(emailNotificationQueue.close());
  closePromises.push(analyticsProcessingQueue.close());
  closePromises.push(redis.disconnect());

  await Promise.all(closePromises);
  logger.info('All queues and workers closed');
};

// Analytics processing functions
async function processDailySummary(userId?: string, date?: string) {
  const targetDate = date ? new Date(date) : new Date();

  // Get daily reports for the date
  const reports = await prisma.dailyReport.findMany({
    where: {
      date: targetDate,
      ...(userId && { userId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate summary metrics
  const summary = reports.reduce(
    (acc, report) => ({
      totalTickets: acc.totalTickets + report.ticketsResolved,
      totalChats: acc.totalChats + report.chatsHandled,
      totalEmails: acc.totalEmails + report.emailsProcessed,
      totalCalls: acc.totalCalls + report.callsAttended,
      totalGithubIssues: acc.totalGithubIssues + report.githubIssues,
      reportCount: acc.reportCount + 1,
    }),
    {
      totalTickets: 0,
      totalChats: 0,
      totalEmails: 0,
      totalCalls: 0,
      totalGithubIssues: 0,
      reportCount: 0,
    }
  );

  logger.info('Daily summary processed', {
    date: targetDate.toISOString().split('T')[0],
    userId,
    summary,
  });

  return { success: true, summary };
}

async function processWeeklyReport(userId?: string, date?: string) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const reports = await prisma.dailyReport.findMany({
    where: {
      date: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
      ...(userId && { userId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const weeklyStats = reports.reduce(
    (acc, report) => ({
      totalTickets: acc.totalTickets + report.ticketsResolved,
      totalChats: acc.totalChats + report.chatsHandled,
      totalEmails: acc.totalEmails + report.emailsProcessed,
      totalCalls: acc.totalCalls + report.callsAttended,
      totalGithubIssues: acc.totalGithubIssues + report.githubIssues,
      reportCount: acc.reportCount + 1,
    }),
    {
      totalTickets: 0,
      totalChats: 0,
      totalEmails: 0,
      totalCalls: 0,
      totalGithubIssues: 0,
      reportCount: 0,
    }
  );

  logger.info('Weekly report processed', {
    week: `${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`,
    userId,
    stats: weeklyStats,
  });

  return { success: true, stats: weeklyStats };
}

async function processMonthlyReport(userId?: string, date?: string) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  const reports = await prisma.dailyReport.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      ...(userId && { userId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const monthlyStats = reports.reduce(
    (acc, report) => ({
      totalTickets: acc.totalTickets + report.ticketsResolved,
      totalChats: acc.totalChats + report.chatsHandled,
      totalEmails: acc.totalEmails + report.emailsProcessed,
      totalCalls: acc.totalCalls + report.callsAttended,
      totalGithubIssues: acc.totalGithubIssues + report.githubIssues,
      reportCount: acc.reportCount + 1,
    }),
    {
      totalTickets: 0,
      totalChats: 0,
      totalEmails: 0,
      totalCalls: 0,
      totalGithubIssues: 0,
      reportCount: 0,
    }
  );

  logger.info('Monthly report processed', {
    month: `${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}`,
    userId,
    stats: monthlyStats,
  });

  return { success: true, stats: monthlyStats };
}
