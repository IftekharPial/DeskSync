import axios from 'axios';
import { env } from '@dailysync/config';
import { logger } from '../utils/logger';

export interface SlackMessage {
  text?: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
}

export interface SlackAttachment {
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  actions?: SlackAction[];
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackAction {
  type: string;
  text: string;
  url?: string;
  style?: 'default' | 'primary' | 'danger';
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: any[];
  accessory?: any;
}

export class SlackIntegrationService {
  private botToken?: string;

  constructor() {
    this.botToken = env.SLACK_BOT_TOKEN;
  }

  /**
   * Send a message to Slack using webhook URL
   */
  async sendWebhookMessage(webhookUrl: string, message: SlackMessage): Promise<void> {
    try {
      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.status !== 200) {
        throw new Error(`Slack webhook returned status ${response.status}`);
      }

      logger.info('Slack webhook message sent successfully', {
        webhookUrl: this.maskWebhookUrl(webhookUrl),
        messageLength: JSON.stringify(message).length,
      });

    } catch (error) {
      logger.error('Failed to send Slack webhook message', {
        webhookUrl: this.maskWebhookUrl(webhookUrl),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send a message using Slack Web API (requires bot token)
   */
  async sendApiMessage(channel: string, message: SlackMessage): Promise<void> {
    if (!this.botToken) {
      throw new Error('Slack bot token not configured');
    }

    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel,
          ...message,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      logger.info('Slack API message sent successfully', {
        channel,
        messageTs: response.data.ts,
      });

    } catch (error) {
      logger.error('Failed to send Slack API message', {
        channel,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a formatted message for support notifications
   */
  createSupportNotification(data: {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    customer?: string;
    ticketId?: string;
    ticketUrl?: string;
    assignee?: string;
    metadata?: Record<string, any>;
  }): SlackMessage {
    const priorityColors = {
      low: '#36a64f',      // green
      medium: '#ff9500',   // orange
      high: '#ff0000',     // red
      critical: '#8B0000', // dark red
    };

    const priorityEmojis = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      critical: '🚨',
    };

    const color = priorityColors[data.priority || 'medium'];
    const emoji = priorityEmojis[data.priority || 'medium'];

    const fields: SlackField[] = [];

    if (data.customer) {
      fields.push({
        title: 'Customer',
        value: data.customer,
        short: true,
      });
    }

    if (data.assignee) {
      fields.push({
        title: 'Assignee',
        value: data.assignee,
        short: true,
      });
    }

    if (data.priority) {
      fields.push({
        title: 'Priority',
        value: `${emoji} ${data.priority.toUpperCase()}`,
        short: true,
      });
    }

    if (data.ticketId) {
      fields.push({
        title: 'Ticket ID',
        value: data.ticketId,
        short: true,
      });
    }

    // Add metadata fields
    if (data.metadata) {
      for (const [key, value] of Object.entries(data.metadata)) {
        if (value !== null && value !== undefined) {
          fields.push({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value),
            short: true,
          });
        }
      }
    }

    const actions: SlackAction[] = [];
    if (data.ticketUrl) {
      actions.push({
        type: 'button',
        text: 'View Ticket',
        url: data.ticketUrl,
        style: 'primary',
      });
    }

    return {
      text: data.title,
      attachments: [
        {
          color,
          title: data.title,
          text: data.description,
          fields,
          actions,
          footer: 'DailySync Support',
          footer_icon: 'https://dailysync.com/icon.png',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  /**
   * Create a formatted message for webhook delivery notifications
   */
  createWebhookNotification(data: {
    webhookName: string;
    status: 'success' | 'failed';
    endpointUrl: string;
    responseTime?: number;
    error?: string;
    payloadSize?: number;
  }): SlackMessage {
    const statusEmoji = data.status === 'success' ? '✅' : '❌';
    const color = data.status === 'success' ? 'good' : 'danger';

    const fields: SlackField[] = [
      {
        title: 'Webhook',
        value: data.webhookName,
        short: true,
      },
      {
        title: 'Endpoint',
        value: this.maskUrl(data.endpointUrl),
        short: true,
      },
    ];

    if (data.responseTime) {
      fields.push({
        title: 'Response Time',
        value: `${data.responseTime}ms`,
        short: true,
      });
    }

    if (data.payloadSize) {
      fields.push({
        title: 'Payload Size',
        value: `${Math.round(data.payloadSize / 1024)}KB`,
        short: true,
      });
    }

    if (data.error) {
      fields.push({
        title: 'Error',
        value: data.error,
        short: false,
      });
    }

    return {
      text: `${statusEmoji} Webhook Delivery ${data.status === 'success' ? 'Successful' : 'Failed'}`,
      attachments: [
        {
          color,
          title: `Webhook Delivery ${data.status === 'success' ? 'Successful' : 'Failed'}`,
          fields,
          footer: 'DailySync Webhook Monitor',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  /**
   * Create a daily report summary message
   */
  createDailyReportSummary(data: {
    agentName: string;
    date: string;
    metrics: {
      tickets: number;
      chats: number;
      githubIssues: number;
      emails: number;
      calls: number;
    };
    notes?: string;
  }): SlackMessage {
    const fields: SlackField[] = [
      {
        title: '🎫 Tickets Resolved',
        value: data.metrics.tickets.toString(),
        short: true,
      },
      {
        title: '💬 Chats Handled',
        value: data.metrics.chats.toString(),
        short: true,
      },
      {
        title: '🐛 GitHub Issues',
        value: data.metrics.githubIssues.toString(),
        short: true,
      },
      {
        title: '📧 Emails Processed',
        value: data.metrics.emails.toString(),
        short: true,
      },
      {
        title: '📞 Calls Attended',
        value: data.metrics.calls.toString(),
        short: true,
      },
    ];

    return {
      text: `📊 Daily Report - ${data.agentName}`,
      attachments: [
        {
          color: 'good',
          title: `Daily Report - ${data.agentName}`,
          text: `Report for ${data.date}`,
          fields,
          footer: 'DailySync Reports',
          ts: Math.floor(Date.now() / 1000),
        },
        ...(data.notes ? [{
          color: '#f0f0f0',
          title: 'Notes',
          text: data.notes,
        }] : []),
      ],
    };
  }

  /**
   * Validate Slack webhook URL
   */
  isValidWebhookUrl(url: string): boolean {
    return url.startsWith('https://hooks.slack.com/services/');
  }

  /**
   * Mask sensitive parts of URLs for logging
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.substring(0, 20)}...`;
    } catch {
      return url.substring(0, 30) + '...';
    }
  }

  /**
   * Mask webhook URL for logging
   */
  private maskWebhookUrl(url: string): string {
    if (url.includes('hooks.slack.com')) {
      const parts = url.split('/');
      if (parts.length >= 6) {
        return `https://hooks.slack.com/services/${parts[5]}/***/***/***`;
      }
    }
    return this.maskUrl(url);
  }
}

// Export singleton instance
export const slackIntegration = new SlackIntegrationService();
