import axios, { AxiosResponse } from 'axios';
import { Job } from 'bullmq';
import { prisma } from '@dailysync/database';
import { logger, logWebhookDelivery } from '../utils/logger';
import { TemplateProcessor } from './templateProcessor';

export interface WebhookDeliveryJobData {
  payloadLogId: string;
  endpointId: string;
  payload: any;
  headers?: Record<string, string>;
  template?: string;
  isTest?: boolean;
}

export interface DeliveryResult {
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
  duration: number;
}

export class WebhookDeliveryService {
  private templateProcessor: TemplateProcessor;

  constructor() {
    this.templateProcessor = new TemplateProcessor();
  }

  async processDeliveryJob(job: Job<WebhookDeliveryJobData>): Promise<DeliveryResult> {
    const { payloadLogId, endpointId, payload, headers, template, isTest } = job.data;
    const startTime = Date.now();

    try {
      // Get endpoint details
      const endpoint = await prisma.outgoingEndpoint.findUnique({
        where: { id: endpointId },
        include: {
          messageTemplate: true,
        },
      });

      if (!endpoint) {
        throw new Error(`Endpoint ${endpointId} not found`);
      }

      if (!endpoint.isActive && !isTest) {
        throw new Error(`Endpoint ${endpointId} is not active`);
      }

      // Process payload through template if available
      let transformedPayload = payload;
      const templateToUse = template || endpoint.messageTemplate?.template;

      if (templateToUse) {
        try {
          transformedPayload = this.templateProcessor.processTemplate(templateToUse, payload);
        } catch (templateError) {
          logger.warn('Template processing failed, using original payload', {
            endpointId,
            error: templateError.message,
          });
        }
      }

      // Prepare request configuration
      const requestConfig = {
        method: endpoint.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete',
        url: endpoint.url,
        data: transformedPayload,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DailySync-Webhook-Delivery/1.0',
          ...(endpoint.headers as Record<string, string> || {}),
          ...(headers || {}),
        },
        timeout: endpoint.timeoutMs,
        validateStatus: (status: number) => status < 500, // Don't throw on 4xx errors
      };

      // Make the HTTP request
      const response: AxiosResponse = await axios(requestConfig);
      const duration = Date.now() - startTime;

      const isSuccess = response.status >= 200 && response.status < 300;
      const result: DeliveryResult = {
        success: isSuccess,
        status: response.status,
        response: this.truncateResponse(response.data),
        duration,
      };

      // Update delivery log
      await this.updateDeliveryLog(payloadLogId, endpointId, {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        transformedPayload,
        responseStatus: response.status,
        responseBody: result.response,
        deliveredAt: isSuccess ? new Date() : undefined,
        attemptNumber: job.attemptsMade + 1,
      });

      logWebhookDelivery(endpointId, endpointId, isSuccess, duration);

      if (!isSuccess) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

      const result: DeliveryResult = {
        success: false,
        status: error.response?.status,
        error: errorMessage,
        duration,
      };

      // Update delivery log with error
      await this.updateDeliveryLog(payloadLogId, endpointId, {
        status: job.attemptsMade + 1 >= (job.opts?.attempts || 1) ? 'FAILED' : 'RETRYING',
        responseStatus: error.response?.status,
        responseBody: error.response?.data ? this.truncateResponse(error.response.data) : undefined,
        errorMessage,
        attemptNumber: job.attemptsMade + 1,
      });

      logWebhookDelivery(endpointId, endpointId, false, duration, errorMessage);

      throw error;
    }
  }

  private async updateDeliveryLog(
    payloadLogId: string,
    endpointId: string,
    data: {
      status: string;
      transformedPayload?: any;
      responseStatus?: number;
      responseBody?: string;
      errorMessage?: string;
      deliveredAt?: Date;
      attemptNumber: number;
    }
  ): Promise<void> {
    try {
      await prisma.deliveryLog.updateMany({
        where: {
          payloadLogId,
          outgoingEndpointId: endpointId,
        },
        data,
      });
    } catch (error) {
      logger.error('Failed to update delivery log', {
        payloadLogId,
        endpointId,
        error: error.message,
      });
    }
  }

  private truncateResponse(data: any): string {
    const maxLength = 10000; // 10KB limit for response storage
    let responseStr: string;

    if (typeof data === 'string') {
      responseStr = data;
    } else {
      try {
        responseStr = JSON.stringify(data);
      } catch {
        responseStr = String(data);
      }
    }

    if (responseStr.length > maxLength) {
      return responseStr.substring(0, maxLength) + '... [truncated]';
    }

    return responseStr;
  }

  // Retry logic for failed deliveries
  async retryFailedDelivery(deliveryLogId: string): Promise<void> {
    const deliveryLog = await prisma.deliveryLog.findUnique({
      where: { id: deliveryLogId },
      include: {
        payloadLog: true,
        outgoingEndpoint: {
          include: {
            messageTemplate: true,
          },
        },
      },
    });

    if (!deliveryLog) {
      throw new Error(`Delivery log ${deliveryLogId} not found`);
    }

    if (deliveryLog.status === 'SUCCESS') {
      throw new Error('Cannot retry successful delivery');
    }

    const endpoint = deliveryLog.outgoingEndpoint;
    if (!endpoint.isActive) {
      throw new Error('Cannot retry delivery to inactive endpoint');
    }

    // Create a new delivery job
    const jobData: WebhookDeliveryJobData = {
      payloadLogId: deliveryLog.payloadLogId,
      endpointId: deliveryLog.outgoingEndpointId,
      payload: deliveryLog.payloadLog.payload,
      template: endpoint.messageTemplate?.template,
    };

    // Import here to avoid circular dependency
    const { addWebhookDeliveryJob } = await import('./queue');
    
    await addWebhookDeliveryJob(jobData, {
      delay: endpoint.retryDelayMs,
      attempts: endpoint.retryAttempts,
      backoff: {
        type: 'exponential',
        delay: endpoint.retryDelayMs,
      },
    });

    // Update status to retrying
    await prisma.deliveryLog.update({
      where: { id: deliveryLogId },
      data: { status: 'RETRYING' },
    });

    logger.info('Delivery retry queued', {
      deliveryLogId,
      endpointId: endpoint.id,
    });
  }

  // Get delivery statistics for an endpoint
  async getEndpointStats(endpointId: string, days: number = 30): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageResponseTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const deliveries = await prisma.deliveryLog.findMany({
      where: {
        outgoingEndpointId: endpointId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        status: true,
        deliveredAt: true,
        createdAt: true,
      },
    });

    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(d => d.status === 'SUCCESS').length;
    const failedDeliveries = deliveries.filter(d => d.status === 'FAILED').length;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Calculate average response time for successful deliveries
    const successfulWithTiming = deliveries.filter(d => d.status === 'SUCCESS' && d.deliveredAt);
    const totalResponseTime = successfulWithTiming.reduce((sum, delivery) => {
      const responseTime = delivery.deliveredAt!.getTime() - delivery.createdAt.getTime();
      return sum + responseTime;
    }, 0);

    const averageResponseTime = successfulWithTiming.length > 0 
      ? totalResponseTime / successfulWithTiming.length 
      : 0;

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }
}

// Export singleton instance
export const webhookDeliveryService = new WebhookDeliveryService();
