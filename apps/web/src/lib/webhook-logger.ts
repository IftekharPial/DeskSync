/**
 * Enhanced webhook logging service
 */

import { prisma } from '@dailysync/database';

export interface WebhookLogEntry {
  webhookId: string;
  payload: any;
  headers: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
  payloadType?: 'BOOKING' | 'MEETING' | 'TEST' | 'GENERIC';
  requestSize?: number;
}

export interface WebhookLogUpdate {
  processingStatus?: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  processingError?: string;
  processedAt?: Date;
  responseSentAt?: Date;
  responseStatus?: number;
}

export interface WebhookLogQuery {
  webhookId?: string;
  payloadType?: string;
  processingStatus?: string;
  ipAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class WebhookLogger {
  /**
   * Log incoming webhook payload
   */
  static async logIncomingPayload(entry: WebhookLogEntry): Promise<string> {
    try {
      // Determine payload type if not provided
      let payloadType = entry.payloadType || 'GENERIC';
      if (!entry.payloadType) {
        if (entry.payload.booking) {
          payloadType = 'BOOKING';
        } else if (entry.payload.meeting_id || entry.payload.title) {
          payloadType = 'MEETING';
        } else if (entry.payload.event === 'webhook_test' || entry.payload.test === true) {
          payloadType = 'TEST';
        }
      }

      // Calculate request size
      const requestSize = entry.requestSize || JSON.stringify(entry.payload).length;

      const payloadLog = await prisma.payloadLog.create({
        data: {
          incomingWebhookId: entry.webhookId,
          payload: entry.payload,
          headers: entry.headers,
          userAgent: entry.userAgent || '',
          ipAddress: entry.ipAddress || 'unknown',
          payloadType,
          requestSize,
          processingStatus: 'RECEIVED'
        }
      });

      console.log(`Webhook payload logged: ${payloadLog.id} (${payloadType})`);
      return payloadLog.id;
    } catch (error) {
      console.error('Failed to log webhook payload:', error);
      throw error;
    }
  }

  /**
   * Update payload log with processing status
   */
  static async updatePayloadLog(logId: string, update: WebhookLogUpdate): Promise<void> {
    try {
      await prisma.payloadLog.update({
        where: { id: logId },
        data: {
          processingStatus: update.processingStatus,
          processingError: update.processingError,
          processedAt: update.processedAt,
          responseSentAt: update.responseSentAt,
          responseStatus: update.responseStatus
        }
      });

      console.log(`Payload log updated: ${logId} - Status: ${update.processingStatus}`);
    } catch (error) {
      console.error(`Failed to update payload log ${logId}:`, error);
      throw error;
    }
  }

  /**
   * Mark payload as processing
   */
  static async markAsProcessing(logId: string): Promise<void> {
    await this.updatePayloadLog(logId, {
      processingStatus: 'PROCESSING'
    });
  }

  /**
   * Mark payload as processed successfully
   */
  static async markAsProcessed(logId: string, responseStatus: number = 200): Promise<void> {
    await this.updatePayloadLog(logId, {
      processingStatus: 'PROCESSED',
      processedAt: new Date(),
      responseSentAt: new Date(),
      responseStatus
    });
  }

  /**
   * Mark payload as failed
   */
  static async markAsFailed(logId: string, error: string, responseStatus: number = 500): Promise<void> {
    await this.updatePayloadLog(logId, {
      processingStatus: 'FAILED',
      processingError: error,
      processedAt: new Date(),
      responseSentAt: new Date(),
      responseStatus
    });
  }

  /**
   * Query payload logs with filters
   */
  static async queryLogs(query: WebhookLogQuery): Promise<{
    logs: any[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      webhookId,
      payloadType,
      processingStatus,
      ipAddress,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = query;

    // Build where clause
    const where: any = {};
    
    if (webhookId) where.incomingWebhookId = webhookId;
    if (payloadType) where.payloadType = payloadType;
    if (processingStatus) where.processingStatus = processingStatus;
    if (ipAddress) where.ipAddress = ipAddress;
    
    if (dateFrom || dateTo) {
      where.receivedAt = {};
      if (dateFrom) where.receivedAt.gte = dateFrom;
      if (dateTo) where.receivedAt.lte = dateTo;
    }

    try {
      const [logs, total] = await Promise.all([
        prisma.payloadLog.findMany({
          where,
          include: {
            incomingWebhook: {
              select: {
                id: true,
                name: true,
                url: true
              }
            },
            deliveryLogs: {
              select: {
                id: true,
                status: true,
                deliveredAt: true
              }
            }
          },
          orderBy: { receivedAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.payloadLog.count({ where })
      ]);

      return {
        logs,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Failed to query payload logs:', error);
      throw error;
    }
  }

  /**
   * Get payload log statistics
   */
  static async getLogStatistics(webhookId?: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    processingRequests: number;
    averageProcessingTime: number;
    requestsByType: Record<string, number>;
    requestsByDay: Array<{ date: string; count: number }>;
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const where: any = {
      receivedAt: { gte: dateFrom }
    };
    
    if (webhookId) where.incomingWebhookId = webhookId;

    try {
      const [
        totalRequests,
        successfulRequests,
        failedRequests,
        processingRequests,
        requestsByType,
        allLogs
      ] = await Promise.all([
        prisma.payloadLog.count({ where }),
        prisma.payloadLog.count({ where: { ...where, processingStatus: 'PROCESSED' } }),
        prisma.payloadLog.count({ where: { ...where, processingStatus: 'FAILED' } }),
        prisma.payloadLog.count({ where: { ...where, processingStatus: 'PROCESSING' } }),
        prisma.payloadLog.groupBy({
          by: ['payloadType'],
          where,
          _count: { id: true }
        }),
        prisma.payloadLog.findMany({
          where: {
            ...where,
            processedAt: { not: null },
            receivedAt: { not: null }
          },
          select: {
            receivedAt: true,
            processedAt: true
          }
        })
      ]);

      // Calculate average processing time
      const processingTimes = allLogs
        .filter(log => log.processedAt && log.receivedAt)
        .map(log => log.processedAt!.getTime() - log.receivedAt.getTime());
      
      const averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Format requests by type
      const requestsByTypeFormatted: Record<string, number> = {};
      requestsByType.forEach(item => {
        requestsByTypeFormatted[item.payloadType] = item._count.id;
      });

      // Get requests by day (simplified - would need more complex query for actual daily breakdown)
      const requestsByDay = await this.getRequestsByDay(where, days);

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        processingRequests,
        averageProcessingTime,
        requestsByType: requestsByTypeFormatted,
        requestsByDay
      };
    } catch (error) {
      console.error('Failed to get log statistics:', error);
      throw error;
    }
  }

  /**
   * Get requests grouped by day
   */
  private static async getRequestsByDay(where: any, days: number): Promise<Array<{ date: string; count: number }>> {
    // This is a simplified version - in production you'd want to use database-specific date functions
    const logs = await prisma.payloadLog.findMany({
      where,
      select: { receivedAt: true }
    });

    const dayGroups: Record<string, number> = {};
    
    logs.forEach(log => {
      const date = log.receivedAt.toISOString().split('T')[0];
      dayGroups[date] = (dayGroups[date] || 0) + 1;
    });

    return Object.entries(dayGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Clean up old logs (older than specified days)
   */
  static async cleanupOldLogs(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const result = await prisma.payloadLog.deleteMany({
        where: {
          receivedAt: { lt: cutoffDate }
        }
      });

      console.log(`Cleaned up ${result.count} old payload logs`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }
}
