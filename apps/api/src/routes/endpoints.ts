import { Router } from 'express';
import { prisma } from '@dailysync/database';
import {
  createEndpointSchema,
  updateEndpointSchema,
  createMessageTemplateSchema,
  updateMessageTemplateSchema,
  paginationSchema
} from '@dailysync/database';
import { HTTP_STATUS, PAGINATION } from '@dailysync/config';
import {
  asyncHandler,
  validationError,
  notFoundError,
  forbiddenError
} from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { addWebhookDeliveryJob } from '../services/queue';
import { logger } from '../utils/logger';

const router = Router();

// Get all endpoints for a webhook
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { webhookId } = req.query;

  if (!webhookId || typeof webhookId !== 'string') {
    throw validationError('webhookId query parameter is required');
  }

  // Check if webhook exists and user has access
  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only view their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const endpoints = await prisma.outgoingEndpoint.findMany({
    where: { incomingWebhookId: webhookId },
    include: {
      messageTemplate: true,
      _count: {
        select: {
          deliveryLogs: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: endpoints,
  });
}));

// Get endpoint by ID
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      messageTemplate: true,
      incomingWebhook: {
        select: {
          id: true,
          name: true,
          createdBy: true,
        },
      },
      _count: {
        select: {
          deliveryLogs: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only view their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  res.json({
    success: true,
    data: endpoint,
  });
}));

// Create new endpoint
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const validation = createEndpointSchema.safeParse(req.body);

  if (!validation.success) {
    throw validationError('Invalid endpoint data', validation.error.errors);
  }

  const { incomingWebhookId, ...endpointData } = validation.data;

  // Check if webhook exists and user has access
  const webhook = await prisma.incomingWebhook.findUnique({
    where: { id: incomingWebhookId },
  });

  if (!webhook) {
    throw notFoundError('Webhook not found');
  }

  // Non-admin users can only create endpoints for their own webhooks
  if (req.user?.role !== 'ADMIN' && webhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const endpoint = await prisma.outgoingEndpoint.create({
    data: {
      ...endpointData,
      incomingWebhookId,
    },
    include: {
      messageTemplate: true,
    },
  });

  logger.info('Outgoing endpoint created', {
    endpointId: endpoint.id,
    webhookId: incomingWebhookId,
    createdBy: req.user!.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: endpoint,
    message: 'Endpoint created successfully',
  });
}));

// Update endpoint
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only update their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const validation = updateEndpointSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError('Invalid endpoint data', validation.error.errors);
  }

  const updatedEndpoint = await prisma.outgoingEndpoint.update({
    where: { id },
    data: validation.data,
    include: {
      messageTemplate: true,
    },
  });

  logger.info('Outgoing endpoint updated', {
    endpointId: id,
    updatedBy: req.user!.id,
  });

  res.json({
    success: true,
    data: updatedEndpoint,
    message: 'Endpoint updated successfully',
  });
}));

// Delete endpoint
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only delete their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  await prisma.outgoingEndpoint.delete({
    where: { id },
  });

  logger.info('Outgoing endpoint deleted', {
    endpointId: id,
    deletedBy: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Endpoint deleted successfully',
  });
}));

// Create or update message template for endpoint
router.post('/:id/template', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
      messageTemplate: true,
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only manage templates for their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const validation = endpoint.messageTemplate
    ? updateMessageTemplateSchema.safeParse(req.body)
    : createMessageTemplateSchema.safeParse({ ...req.body, outgoingEndpointId: id });

  if (!validation.success) {
    throw validationError('Invalid template data', validation.error.errors);
  }

  let template;

  if (endpoint.messageTemplate) {
    // Update existing template
    template = await prisma.messageTemplate.update({
      where: { id: endpoint.messageTemplate.id },
      data: validation.data,
    });
  } else {
    // Create new template
    template = await prisma.messageTemplate.create({
      data: {
        ...validation.data,
        outgoingEndpointId: id,
      },
    });
  }

  logger.info('Message template saved', {
    templateId: template.id,
    endpointId: id,
    action: endpoint.messageTemplate ? 'updated' : 'created',
    updatedBy: req.user!.id,
  });

  res.json({
    success: true,
    data: template,
    message: `Template ${endpoint.messageTemplate ? 'updated' : 'created'} successfully`,
  });
}));

// Delete message template
router.delete('/:id/template', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
      messageTemplate: true,
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  if (!endpoint.messageTemplate) {
    throw notFoundError('Template not found');
  }

  // Non-admin users can only delete templates for their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  await prisma.messageTemplate.delete({
    where: { id: endpoint.messageTemplate.id },
  });

  logger.info('Message template deleted', {
    templateId: endpoint.messageTemplate.id,
    endpointId: id,
    deletedBy: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Template deleted successfully',
  });
}));

// Get endpoint delivery logs
router.get('/:id/logs', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only view logs for their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const paginationValidation = paginationSchema.safeParse(req.query);
  const { page, limit } = paginationValidation.success
    ? paginationValidation.data
    : { page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT };

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.deliveryLog.findMany({
      where: { outgoingEndpointId: id },
      skip,
      take: limit,
      include: {
        payloadLog: {
          select: {
            id: true,
            receivedAt: true,
            payload: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.deliveryLog.count({
      where: { outgoingEndpointId: id },
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

// Test endpoint (send a test payload)
router.post('/:id/test', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const testPayload = req.body.payload || { test: true, timestamp: new Date().toISOString() };

  const endpoint = await prisma.outgoingEndpoint.findUnique({
    where: { id },
    include: {
      incomingWebhook: {
        select: {
          createdBy: true,
        },
      },
      messageTemplate: true,
    },
  });

  if (!endpoint) {
    throw notFoundError('Endpoint not found');
  }

  // Non-admin users can only test their own webhook endpoints
  if (req.user?.role !== 'ADMIN' && endpoint.incomingWebhook.createdBy !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  // Create a test payload log
  const payloadLog = await prisma.payloadLog.create({
    data: {
      payload: testPayload,
      headers: { 'x-test': 'true' },
      userAgent: 'DailySync-Test',
      ipAddress: req.ip,
      incomingWebhookId: endpoint.incomingWebhookId,
    },
  });

  // Queue test delivery
  try {
    await addWebhookDeliveryJob({
      payloadLogId: payloadLog.id,
      endpointId: endpoint.id,
      payload: testPayload,
      headers: { 'x-test': 'true' },
      template: endpoint.messageTemplate?.template,
      isTest: true,
    });

    // Create delivery log entry
    await prisma.deliveryLog.create({
      data: {
        status: 'PENDING',
        payloadLogId: payloadLog.id,
        outgoingEndpointId: endpoint.id,
      },
    });

    logger.info('Test delivery queued', {
      endpointId: id,
      payloadLogId: payloadLog.id,
      testedBy: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Test payload queued for delivery',
      data: {
        payloadLogId: payloadLog.id,
        testPayload,
      },
    });
  } catch (error) {
    logger.error('Failed to queue test delivery', {
      endpointId: id,
      error: error.message,
    });

    throw new Error('Failed to queue test delivery');
  }
}));

export { router as endpointRoutes };
