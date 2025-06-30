import {
  User,
  IncomingWebhook,
  DailyReport,
  MeetingReport,
  SupportPlatform,
  MessageTemplate,
  UserRole,
  WebhookStatus,
  MeetingOutcome
} from './generated';

// User types
export type UserWithoutPassword = Omit<User, 'password'>;
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Webhook types
export type CreateWebhookInput = Omit<IncomingWebhook, 'id' | 'createdAt' | 'updatedAt' | 'url'>;
export type UpdateWebhookInput = Partial<Omit<IncomingWebhook, 'id' | 'createdAt' | 'updatedAt' | 'url' | 'userId'>>;

// Report types
export type CreateDailyReportInput = Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDailyReportInput = Partial<Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

export type CreateMeetingReportInput = Omit<MeetingReport, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMeetingReportInput = Partial<Omit<MeetingReport, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

// Support platform types
export type CreateSupportPlatformInput = Omit<SupportPlatform, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupportPlatformInput = Partial<Omit<SupportPlatform, 'id' | 'createdAt' | 'updatedAt'>>;

// Platform report interface for daily reports
export interface PlatformReport {
  platform: string;
  ticketsHandled: number;
}

// Enhanced daily report with platform reports
export interface DailyReportWithPlatforms extends Omit<DailyReport, 'platformReports'> {
  platformReports: PlatformReport[];
}

// Analytics types
export interface DailyReportAnalytics {
  totalTickets: number;
  totalChats: number;
  totalGithubIssues: number;
  totalEmails: number;
  totalCalls: number;
  averageTickets: number;
  averageChats: number;
  averageGithubIssues: number;
  averageEmails: number;
  averageCalls: number;
  reportCount: number;
  platformStats: Array<{
    platform: string;
    totalTickets: number;
    averageTickets: number;
  }>;
}

export interface UserPerformanceMetrics {
  userId: string;
  userName: string;
  totalTickets: number;
  totalChats: number;
  totalGithubIssues: number;
  totalEmails: number;
  totalCalls: number;
  reportCount: number;
  averageDaily: {
    tickets: number;
    chats: number;
    githubIssues: number;
    emails: number;
    calls: number;
  };
}

export interface WebhookAnalytics {
  webhookId: string;
  webhookName: string;
  totalPayloads: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number;
  lastActivity: Date | null;
}



// Filter types for analytics
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface UserFilter {
  userIds?: string[];
  roles?: UserRole[];
}

export interface WebhookFilter {
  webhookIds?: string[];
  status?: WebhookStatus[];
}

// Export enums for convenience (already exported from index.ts)
// export { UserRole, WebhookStatus, MeetingOutcome };
