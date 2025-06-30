import { Router } from 'express';
import { prisma, generateWebhookUrl } from '@dailysync/database';
import { createWebhookSchema, updateWebhookSchema, paginationSchema } from '@dailysync/database';
import { HTTP_STATUS, PAGINATION } from '@dailysync/config';
import {
  asyncHandler,
  validationError,
  notFoundError,
  forbiddenError
} from '../middleware/errorHandler';
import {
  authMiddleware,
  requireAdmin,
  webhookAuthMiddleware
} from '../middleware/auth';
import { webhookRateLimiter } from '../middleware/rateLimiter';
import { addWebhookDeliveryJob } from '../services/queue';
import { logger } from '../utils/logger';

const router = Router();

// Get all webhooks (admin only)
router.get('/', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const paginationValidation = paginationSchema.safeParse(req.query);
  const { page, limit } = paginationValidation.success
    ? paginationValidation.data
    : { page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT };

  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([
    prisma.incomingWebhook.findMany({
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        outgoingEndpoints: {
          select: {
            id: true,
            name: true,
            url: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            payloadLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.incomingWebhook.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: webhooks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}));

// Get webhook by ID
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      outgoingEndpoints: {
        include: {
          messageTemplate: true,
        },
      },
      _count: {
        select: {
          payloadLogs: true,
        },
      },
    },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only view their own webhooks
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  res.json({
    success: true,
    data: webhook,
  });
}));

// Create new webhook
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const validation = createWebhookSchema.safeParse({
    ...req.body,
    createdBy: req.user!.id,
  });

  if (!validation.success) {
    throw validationError('Invalid webhook data', validation.error.errors);
  }

  const { name, description, secret, status } = validation.data;

  // Generate unique webhook URL
  let webhookUrl: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!isUnique && attempts < maxAttempts) {
    webhookUrl = generateWebhookUrl();
    const existing = await prisma.incomingWebhook.findUnique({
      where: { url: webhookUrl },
    });
    isUnique = !existing;
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique webhook URL');
  }

  const webhook = await prisma.incomingWebhook.create({
    data: {
      name,
      description,
      url: webhookUrl!,
      secret,
      status,
      createdBy: req.user!.id,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  logger.info('Webhook created', {
    webhookId: webhook.id,
    name: webhook.name,
    createdBy: req.user!.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: webhook,
    message: 'Webhook created successfully',
  });
}));

// Update webhook
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only update their own webhooks
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const validation = updateWebhookSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError('Invalid webhook data', validation.error.errors);
  }

  const updatedWebhook = await prisma.incomingWebhook.update({
    where: { id },
    data: validation.data,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      outgoingEndpoints: true,
    },
  });

  logger.info('Webhook updated', {
    webhookId: id,
    updatedBy: req.user!.id,
  });

  res.json({
    success: true,
    data: updatedWebhook,
    message: 'Webhook updated successfully',
  });
}));

// Delete webhook
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only delete their own webhooks
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  // Soft delete by setting status to DELETED
  await prisma.incomingWebhook.update({
    where: { id },
    data: { status: 'DELETED' },
  });

  logger.info('Webhook deleted', {
    webhookId: id,
    deletedBy: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Webhook deleted successfully',
  });
}));

// Receive webhook payload (public endpoint with rate limiting)
router.post('/:id/receive', webhookRateLimiter, webhookAuthMiddleware, asyncHandler(async (req, res) => {
  const webhook = (req as any).webhook;
  const payload = req.body;
  const headers = req.headers;
  const userAgent = req.get('User-Agent');
  const ipAddress = req.ip;

  // Log the incoming payload
  const payloadLog = await prisma.payloadLog.create({
    data: {
      payload,
      headers: headers as any,
      userAgent,
      ipAddress,
      incomingWebhookId: webhook.id,
    },
  });

  // Get outgoing endpoints for this webhook
  const outgoingEndpoints = await prisma.outgoingEndpoint.findMany({
    where: {
      incomingWebhookId: webhook.id,
      isActive: true,
    },
    include: {
      messageTemplate: true,
    },
  });

  // Queue delivery jobs for each active endpoint
  const deliveryPromises = outgoingEndpoints.map(async (endpoint) => {
    try {
      await addWebhookDeliveryJob({
        payloadLogId: payloadLog.id,
        endpointId: endpoint.id,
        payload,
        headers,
        template: endpoint.messageTemplate?.template,
      });

      // Create initial delivery log entry
      await prisma.deliveryLog.create({
        data: {
          status: 'PENDING',
          payloadLogId: payloadLog.id,
          outgoingEndpointId: endpoint.id,
        },
      });
    } catch (error) {
      logger.error('Failed to queue delivery job', {
        webhookId: webhook.id,
        endpointId: endpoint.id,
        error: error.message,
      });
    }
  });

  await Promise.all(deliveryPromises);

  logger.info('Webhook payload received and queued', {
    webhookId: webhook.id,
    payloadLogId: payloadLog.id,
    endpointCount: outgoingEndpoints.length,
  });

  res.json({
    success: true,
    message: 'Payload received and queued for delivery',
    data: {
      payloadId: payloadLog.id,
      endpointsQueued: outgoingEndpoints.length,
    },
  });
}));

// Get webhook logs
router.get('/:id/logs', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only view their own webhook logs
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const paginationValidation = paginationSchema.safeParse(req.query);
  const { page, limit } = paginationValidation.success
    ? paginationValidation.data
    : { page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT };

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.payloadLog.findMany({
      where: { incomingWebhookId: id },
      skip,
      take: limit,
      include: {
        deliveryLogs: {
          include: {
            outgoingEndpoint: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
    }),
    prisma.payloadLog.count({
      where: { incomingWebhookId: id },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}));

// Get webhook statistics
router.get('/:id/stats', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only view their own webhook stats
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  // Get date range from query params (default to last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [
    totalPayloads,
    successfulDeliveries,
    failedDeliveries,
    pendingDeliveries,
    lastActivity
  ] = await Promise.all([
    prisma.payloadLog.count({
      where: {
        incomingWebhookId: id,
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.deliveryLog.count({
      where: {
        payloadLog: { incomingWebhookId: id },
        status: 'SUCCESS',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.deliveryLog.count({
      where: {
        payloadLog: { incomingWebhookId: id },
        status: 'FAILED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.deliveryLog.count({
      where: {
        payloadLog: { incomingWebhookId: id },
        status: 'PENDING',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.payloadLog.findFirst({
      where: { incomingWebhookId: id },
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true },
    }),
  ]);

  const totalDeliveries = successfulDeliveries + failedDeliveries + pendingDeliveries;
  const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalPayloads,
      deliveries: {
        successful: successfulDeliveries,
        failed: failedDeliveries,
        pending: pendingDeliveries,
        total: totalDeliveries,
        successRate: Math.round(successRate * 100) / 100,
      },
      lastActivity: lastActivity?.receivedAt || null,
      dateRange: {
        startDate,
        endDate,
      },
    },
  });
}));

export { router as webhookRoutes };
