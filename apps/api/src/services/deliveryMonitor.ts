import { prisma } from '@dailysync/database';
import { logger } from '../utils/logger';
import { webhookDeliveryService } from './webhookDelivery';
import { slackIntegration } from './slackIntegration';
import { addWebhookDeliveryJob } from './queue';

export interface DeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  retryingDeliveries: number;
  successRate: number;
  averageResponseTime: number;
}

export interface EndpointHealth {
  endpointId: string;
  endpointName: string;
  endpointUrl: string;
  isActive: boolean;
  stats: DeliveryStats;
  lastSuccessfulDelivery?: Date;
  lastFailedDelivery?: Date;
  consecutiveFailures: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export class DeliveryMonitorService {
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly DEGRADED_SUCCESS_RATE_THRESHOLD = 80; // 80%
  private readonly UNHEALTHY_SUCCESS_RATE_THRESHOLD = 50; // 50%

  private healthCheckTimer?: NodeJS.Timeout;

  /**
   * Start the delivery monitoring service
   */
  start(): void {
    logger.info('Starting delivery monitor service');
    
    // Run initial health check
    this.performHealthCheck().catch(error => {
      logger.error('Initial health check failed', { error: error.message });
    });

    // Schedule periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error('Scheduled health check failed', { error: error.message });
      });
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop the delivery monitoring service
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    logger.info('Delivery monitor service stopped');
  }

  /**
   * Perform health check on all active endpoints
   */
  async performHealthCheck(): Promise<void> {
    try {
      const endpoints = await prisma.outgoingEndpoint.findMany({
        where: { isActive: true },
        include: {
          incomingWebhook: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      const healthChecks = endpoints.map(endpoint => this.checkEndpointHealth(endpoint));
      const healthResults = await Promise.allSettled(healthChecks);

      let healthyCount = 0;
      let degradedCount = 0;
      let unhealthyCount = 0;

      healthResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const health = result.value;
          switch (health.healthStatus) {
            case 'healthy':
              healthyCount++;
              break;
            case 'degraded':
              degradedCount++;
              break;
            case 'unhealthy':
              unhealthyCount++;
              break;
          }
        } else {
          logger.error('Health check failed for endpoint', {
            endpointId: endpoints[index].id,
            error: result.reason.message,
          });
        }
      });

      logger.info('Health check completed', {
        totalEndpoints: endpoints.length,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount,
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
    }
  }

  /**
   * Check health of a specific endpoint
   */
  async checkEndpointHealth(endpoint: any): Promise<EndpointHealth> {
    const stats = await this.getDeliveryStats(endpoint.id, 24); // Last 24 hours
    const consecutiveFailures = await this.getConsecutiveFailures(endpoint.id);
    
    const lastSuccessfulDelivery = await prisma.deliveryLog.findFirst({
      where: {
        outgoingEndpointId: endpoint.id,
        status: 'SUCCESS',
      },
      orderBy: { deliveredAt: 'desc' },
      select: { deliveredAt: true },
    });

    const lastFailedDelivery = await prisma.deliveryLog.findFirst({
      where: {
        outgoingEndpointId: endpoint.id,
        status: 'FAILED',
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      healthStatus = 'unhealthy';
    } else if (stats.successRate < this.UNHEALTHY_SUCCESS_RATE_THRESHOLD) {
      healthStatus = 'unhealthy';
    } else if (stats.successRate < this.DEGRADED_SUCCESS_RATE_THRESHOLD) {
      healthStatus = 'degraded';
    }

    const health: EndpointHealth = {
      endpointId: endpoint.id,
      endpointName: endpoint.name,
      endpointUrl: endpoint.url,
      isActive: endpoint.isActive,
      stats,
      lastSuccessfulDelivery: lastSuccessfulDelivery?.deliveredAt || undefined,
      lastFailedDelivery: lastFailedDelivery?.createdAt || undefined,
      consecutiveFailures,
      healthStatus,
    };

    // Log health issues
    if (healthStatus !== 'healthy') {
      logger.warn('Endpoint health issue detected', {
        endpointId: endpoint.id,
        endpointName: endpoint.name,
        healthStatus,
        successRate: stats.successRate,
        consecutiveFailures,
      });

      // Optionally send alerts for unhealthy endpoints
      if (healthStatus === 'unhealthy') {
        await this.sendHealthAlert(health);
      }
    }

    return health;
  }

  /**
   * Get delivery statistics for an endpoint
   */
  async getDeliveryStats(endpointId: string, hours: number = 24): Promise<DeliveryStats> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const deliveries = await prisma.deliveryLog.findMany({
      where: {
        outgoingEndpointId: endpointId,
        createdAt: {
          gte: startTime,
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
    const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;
    const retryingDeliveries = deliveries.filter(d => d.status === 'RETRYING').length;

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
      pendingDeliveries,
      retryingDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }

  /**
   * Get consecutive failure count for an endpoint
   */
  async getConsecutiveFailures(endpointId: string): Promise<number> {
    const recentDeliveries = await prisma.deliveryLog.findMany({
      where: { outgoingEndpointId: endpointId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Check last 20 deliveries
      select: { status: true },
    });

    let consecutiveFailures = 0;
    for (const delivery of recentDeliveries) {
      if (delivery.status === 'FAILED') {
        consecutiveFailures++;
      } else if (delivery.status === 'SUCCESS') {
        break; // Stop counting when we hit a success
      }
      // Skip PENDING and RETRYING statuses
    }

    return consecutiveFailures;
  }

  /**
   * Retry failed deliveries for an endpoint
   */
  async retryFailedDeliveries(endpointId: string, maxRetries: number = 10): Promise<number> {
    const failedDeliveries = await prisma.deliveryLog.findMany({
      where: {
        outgoingEndpointId: endpointId,
        status: 'FAILED',
      },
      take: maxRetries,
      orderBy: { createdAt: 'desc' },
      include: {
        payloadLog: true,
        outgoingEndpoint: {
          include: {
            messageTemplate: true,
          },
        },
      },
    });

    let retriedCount = 0;

    for (const delivery of failedDeliveries) {
      try {
        await webhookDeliveryService.retryFailedDelivery(delivery.id);
        retriedCount++;
      } catch (error) {
        logger.error('Failed to retry delivery', {
          deliveryLogId: delivery.id,
          endpointId,
          error: error.message,
        });
      }
    }

    logger.info('Retried failed deliveries', {
      endpointId,
      retriedCount,
      totalFailed: failedDeliveries.length,
    });

    return retriedCount;
  }

  /**
   * Send health alert for unhealthy endpoints
   */
  private async sendHealthAlert(health: EndpointHealth): Promise<void> {
    try {
      // This would typically send to a monitoring channel or alert system
      // For now, we'll just log it
      logger.error('Endpoint health alert', {
        endpointId: health.endpointId,
        endpointName: health.endpointName,
        healthStatus: health.healthStatus,
        successRate: health.stats.successRate,
        consecutiveFailures: health.consecutiveFailures,
        lastSuccessfulDelivery: health.lastSuccessfulDelivery,
      });

      // Optionally send Slack notification if configured
      // const message = slackIntegration.createWebhookNotification({
      //   webhookName: health.endpointName,
      //   status: 'failed',
      //   endpointUrl: health.endpointUrl,
      //   error: `Health status: ${health.healthStatus}, Success rate: ${health.stats.successRate}%`,
      // });
      // await slackIntegration.sendWebhookMessage(alertWebhookUrl, message);

    } catch (error) {
      logger.error('Failed to send health alert', {
        endpointId: health.endpointId,
        error: error.message,
      });
    }
  }

  /**
   * Get overall system delivery statistics
   */
  async getSystemStats(hours: number = 24): Promise<DeliveryStats> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const deliveries = await prisma.deliveryLog.findMany({
      where: {
        createdAt: {
          gte: startTime,
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
    const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;
    const retryingDeliveries = deliveries.filter(d => d.status === 'RETRYING').length;

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
      pendingDeliveries,
      retryingDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
    };
  }
}

// Export singleton instance
export const deliveryMonitor = new DeliveryMonitorService();
