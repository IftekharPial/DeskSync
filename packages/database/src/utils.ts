import bcrypt from 'bcryptjs';
import { prisma } from './index';
import {
  UserWithoutPassword,
  DailyReportAnalytics,
  UserPerformanceMetrics,
  WebhookAnalytics,
  PlatformReport,
  DateRangeFilter,
  UserFilter,
  WebhookFilter
} from './types';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// User utilities
export const excludePassword = (user: any): UserWithoutPassword => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const generateWebhookUrl = (): string => {
  const randomString = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
  return `/webhook/${randomString}`;
};

// Analytics utilities
export const calculateDailyReportAnalytics = async (
  filter: DateRangeFilter & UserFilter
): Promise<DailyReportAnalytics> => {
  const whereClause: any = {
    date: {
      gte: filter.startDate,
      lte: filter.endDate,
    },
  };

  if (filter.userIds && filter.userIds.length > 0) {
    whereClause.userId = { in: filter.userIds };
  }

  if (filter.roles && filter.roles.length > 0) {
    whereClause.user = {
      role: { in: filter.roles },
    };
  }

  const reports = await prisma.dailyReport.findMany({
    where: whereClause,
    include: {
      user: true,
    },
  });

  const totals = reports.reduce(
    (acc, report) => ({
      tickets: acc.tickets + report.ticketsResolved,
      chats: acc.chats + report.chatsHandled,
      githubIssues: acc.githubIssues + report.githubIssues,
      emails: acc.emails + report.emailsProcessed,
      calls: acc.calls + report.callsAttended,
    }),
    { tickets: 0, chats: 0, githubIssues: 0, emails: 0, calls: 0 }
  );

  const reportCount = reports.length;

  // Calculate platform-specific statistics
  const platformMetrics = new Map<string, { totalTickets: number; reportCount: number }>();

  reports.forEach((report) => {
    // Process platformReports JSON field if it exists
    if (report.platformReports && Array.isArray(report.platformReports)) {
      (report.platformReports as unknown as PlatformReport[]).forEach((platformReport) => {
        if (platformReport.platform && typeof platformReport.ticketsHandled === 'number') {
          const existing = platformMetrics.get(platformReport.platform) || {
            totalTickets: 0,
            reportCount: 0,
          };

          existing.totalTickets += platformReport.ticketsHandled;
          existing.reportCount += 1;

          platformMetrics.set(platformReport.platform, existing);
        }
      });
    }
  });

  // Convert platform metrics to the required format
  const platformStats = Array.from(platformMetrics.entries()).map(([platform, metrics]) => ({
    platform,
    totalTickets: metrics.totalTickets,
    averageTickets: metrics.reportCount > 0 ? metrics.totalTickets / metrics.reportCount : 0,
  }));

  return {
    totalTickets: totals.tickets,
    totalChats: totals.chats,
    totalGithubIssues: totals.githubIssues,
    totalEmails: totals.emails,
    totalCalls: totals.calls,
    averageTickets: reportCount > 0 ? totals.tickets / reportCount : 0,
    averageChats: reportCount > 0 ? totals.chats / reportCount : 0,
    averageGithubIssues: reportCount > 0 ? totals.githubIssues / reportCount : 0,
    averageEmails: reportCount > 0 ? totals.emails / reportCount : 0,
    averageCalls: reportCount > 0 ? totals.calls / reportCount : 0,
    reportCount,
    platformStats,
  };
};

export const getUserPerformanceMetrics = async (
  filter: DateRangeFilter & UserFilter
): Promise<UserPerformanceMetrics[]> => {
  const whereClause: any = {
    date: {
      gte: filter.startDate,
      lte: filter.endDate,
    },
  };

  if (filter.userIds && filter.userIds.length > 0) {
    whereClause.userId = { in: filter.userIds };
  }

  if (filter.roles && filter.roles.length > 0) {
    whereClause.user = {
      role: { in: filter.roles },
    };
  }

  const reports = await prisma.dailyReport.findMany({
    where: whereClause,
    include: {
      user: true,
    },
  });

  const userMetrics = new Map<string, {
    user: any;
    totals: {
      tickets: number;
      chats: number;
      githubIssues: number;
      emails: number;
      calls: number;
    };
    reportCount: number;
  }>();

  reports.forEach((report) => {
    const existing = userMetrics.get(report.userId) || {
      user: report.user,
      totals: { tickets: 0, chats: 0, githubIssues: 0, emails: 0, calls: 0 },
      reportCount: 0,
    };

    existing.totals.tickets += report.ticketsResolved;
    existing.totals.chats += report.chatsHandled;
    existing.totals.githubIssues += report.githubIssues;
    existing.totals.emails += report.emailsProcessed;
    existing.totals.calls += report.callsAttended;
    existing.reportCount += 1;

    userMetrics.set(report.userId, existing);
  });

  return Array.from(userMetrics.values()).map(({ user, totals, reportCount }) => ({
    userId: user.id,
    userName: user.name,
    totalTickets: totals.tickets,
    totalChats: totals.chats,
    totalGithubIssues: totals.githubIssues,
    totalEmails: totals.emails,
    totalCalls: totals.calls,
    reportCount,
    averageDaily: {
      tickets: reportCount > 0 ? totals.tickets / reportCount : 0,
      chats: reportCount > 0 ? totals.chats / reportCount : 0,
      githubIssues: reportCount > 0 ? totals.githubIssues / reportCount : 0,
      emails: reportCount > 0 ? totals.emails / reportCount : 0,
      calls: reportCount > 0 ? totals.calls / reportCount : 0,
    },
  }));
};

export const getWebhookAnalytics = async (
  filter: DateRangeFilter & WebhookFilter
): Promise<WebhookAnalytics[]> => {
  const whereClause: any = {
    createdAt: {
      gte: filter.startDate,
      lte: filter.endDate,
    },
  };

  if (filter.webhookIds && filter.webhookIds.length > 0) {
    whereClause.id = { in: filter.webhookIds };
  }

  if (filter.status && filter.status.length > 0) {
    whereClause.status = { in: filter.status };
  }

  // Get webhooks and their associated meeting reports for analytics
  const webhooks = await prisma.incomingWebhook.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          meetingReports: {
            where: {
              createdAt: {
                gte: filter.startDate,
                lte: filter.endDate,
              },
            },
          },
        },
      },
    },
  });

  return webhooks.map((webhook) => {
    const meetingReports = webhook.user?.meetingReports || [];
    const totalMeetings = meetingReports.length;
    const successfulMeetings = meetingReports.filter(m => m.outcome === 'COMPLETED').length;

    return {
      webhookId: webhook.id,
      webhookName: webhook.name,
      totalPayloads: totalMeetings,
      successfulDeliveries: successfulMeetings,
      failedDeliveries: totalMeetings - successfulMeetings,
      successRate: totalMeetings > 0 ? (successfulMeetings / totalMeetings) * 100 : 0,
      averageResponseTime: 0, // Not applicable without delivery logs
      lastActivity: meetingReports.length > 0
        ? meetingReports.reduce((latest, report) =>
            report.createdAt > latest ? report.createdAt : latest,
            meetingReports[0].createdAt
          )
        : null,
    };
  });
};

// Date utilities
export const getDateRange = (days: number): DateRangeFilter => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return { startDate, endDate };
};

export const formatDateForDatabase = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
