import { Router } from 'express';
import { prisma, calculateDailyReportAnalytics, getUserPerformanceMetrics, getWebhookAnalytics } from '@dailysync/database';
import { dateRangeFilterSchema, userFilterSchema, webhookFilterSchema } from '@dailysync/database';
import { HTTP_STATUS } from '@dailysync/config';
import {
  asyncHandler,
  validationError,
  forbiddenError
} from '../middleware/errorHandler';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { deliveryMonitor } from '../services/deliveryMonitor';
import { logger } from '../utils/logger';

const router = Router();

// Dashboard overview - main analytics endpoint
router.get('/dashboard', authMiddleware, asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const userId = req.user!.id;

  // Get date range (default to last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    // Get daily reports analytics
    const dailyReportsFilter = {
      startDate,
      endDate,
      ...(isAdmin ? {} : { userIds: [userId] }),
    };

    const [
      dailyReportsAnalytics,
      userPerformanceMetrics,
      systemDeliveryStats,
      recentActivity
    ] = await Promise.all([
      calculateDailyReportAnalytics(dailyReportsFilter),
      isAdmin ? getUserPerformanceMetrics(dailyReportsFilter) : [],
      isAdmin ? deliveryMonitor.getSystemStats(24) : null,
      getRecentActivity(isAdmin ? undefined : userId, 10),
    ]);

    // Get user-specific stats if not admin
    let userStats = null;
    if (!isAdmin) {
      userStats = await getUserStats(userId, 30);
    }

    // Get webhook stats for admin
    let webhookStats = null;
    if (isAdmin) {
      webhookStats = await getWebhookAnalytics({
        startDate,
        endDate,
      });
    }

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          days: 30,
        },
        dailyReports: dailyReportsAnalytics,
        userPerformance: userPerformanceMetrics,
        userStats,
        webhookStats: webhookStats?.slice(0, 5), // Top 5 webhooks
        deliveryStats: systemDeliveryStats,
        recentActivity,
      },
    });

  } catch (error) {
    logger.error('Dashboard analytics failed', {
      userId,
      isAdmin,
      error: error.message,
    });
    throw error;
  }
}));

// Daily reports analytics with filtering
router.get('/daily-reports', authMiddleware, asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';

  // Parse and validate filters
  const dateRangeValidation = dateRangeFilterSchema.safeParse({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
  });

  if (!dateRangeValidation.success) {
    throw validationError('Invalid date range', dateRangeValidation.error.errors);
  }

  const userFilterValidation = userFilterSchema.safeParse({
    userIds: req.query.userIds ? (req.query.userIds as string).split(',') : undefined,
    roles: req.query.roles ? (req.query.roles as string).split(',') : undefined,
  });

  if (!userFilterValidation.success) {
    throw validationError('Invalid user filter', userFilterValidation.error.errors);
  }

  const filters = {
    ...dateRangeValidation.data,
    ...userFilterValidation.data,
  };

  // Non-admin users can only see their own data
  if (!isAdmin) {
    filters.userIds = [req.user!.id];
  }

  const analytics = await calculateDailyReportAnalytics(filters);

  // Get time series data for charts
  const timeSeriesData = await getDailyReportsTimeSeries(filters);

  res.json({
    success: true,
    data: {
      filters,
      analytics,
      timeSeries: timeSeriesData,
    },
  });
}));

// User performance metrics
router.get('/user-performance', authMiddleware, asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';

  // Parse filters
  const dateRangeValidation = dateRangeFilterSchema.safeParse({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
  });

  if (!dateRangeValidation.success) {
    throw validationError('Invalid date range', dateRangeValidation.error.errors);
  }

  const userFilterValidation = userFilterSchema.safeParse({
    userIds: req.query.userIds ? (req.query.userIds as string).split(',') : undefined,
    roles: req.query.roles ? (req.query.roles as string).split(',') : undefined,
  });

  if (!userFilterValidation.success) {
    throw validationError('Invalid user filter', userFilterValidation.error.errors);
  }

  const filters = {
    ...dateRangeValidation.data,
    ...userFilterValidation.data,
  };

  // Non-admin users can only see their own performance
  if (!isAdmin) {
    filters.userIds = [req.user!.id];
  }

  const userMetrics = await getUserPerformanceMetrics(filters);

  // Sort by total activity (tickets + chats + emails + calls)
  const sortedMetrics = userMetrics.sort((a, b) => {
    const aTotal = a.totalTickets + a.totalChats + a.totalEmails + a.totalCalls;
    const bTotal = b.totalTickets + b.totalChats + b.totalEmails + b.totalCalls;
    return bTotal - aTotal;
  });

  res.json({
    success: true,
    data: {
      filters,
      metrics: sortedMetrics,
    },
  });
}));

// Webhook analytics (admin only)
router.get('/webhook-analytics', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  // Parse filters
  const dateRangeValidation = dateRangeFilterSchema.safeParse({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
  });

  if (!dateRangeValidation.success) {
    throw validationError('Invalid date range', dateRangeValidation.error.errors);
  }

  const webhookFilterValidation = webhookFilterSchema.safeParse({
    webhookIds: req.query.webhookIds ? (req.query.webhookIds as string).split(',') : undefined,
    status: req.query.status ? (req.query.status as string).split(',') : undefined,
  });

  if (!webhookFilterValidation.success) {
    throw validationError('Invalid webhook filter', webhookFilterValidation.error.errors);
  }

  const filters = {
    ...dateRangeValidation.data,
    ...webhookFilterValidation.data,
  };

  const webhookAnalytics = await getWebhookAnalytics(filters);

  // Get system delivery stats
  const systemStats = await deliveryMonitor.getSystemStats(
    Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60))
  );

  res.json({
    success: true,
    data: {
      filters,
      webhooks: webhookAnalytics,
      systemStats,
    },
  });
}));

// Export analytics data
router.get('/export', authMiddleware, asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const format = req.query.format as string || 'json';

  if (!['json', 'csv'].includes(format)) {
    throw validationError('Invalid export format. Supported: json, csv');
  }

  // Parse filters
  const dateRangeValidation = dateRangeFilterSchema.safeParse({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
  });

  if (!dateRangeValidation.success) {
    throw validationError('Invalid date range', dateRangeValidation.error.errors);
  }

  const filters = {
    ...dateRangeValidation.data,
    ...(isAdmin ? {} : { userIds: [req.user!.id] }),
  };

  // Get data to export
  const [dailyReports, meetingReports] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        ...(filters.userIds ? { userId: { in: filters.userIds } } : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.meetingReport.findMany({
      where: {
        startTime: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        ...(filters.userIds ? { userId: { in: filters.userIds } } : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    }),
  ]);

  if (format === 'csv') {
    // Generate CSV format
    const csvData = generateCSV({ dailyReports, meetingReports });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      filters,
      data: {
        dailyReports,
        meetingReports,
      },
    });
  }

  logger.info('Analytics data exported', {
    userId: req.user!.id,
    format,
    dailyReportsCount: dailyReports.length,
    meetingReportsCount: meetingReports.length,
  });
}));

// Helper function to get recent activity
async function getRecentActivity(userId?: string, limit: number = 10) {
  const whereClause = userId ? { userId } : {};

  const [recentReports, recentMeetings] = await Promise.all([
    prisma.dailyReport.findMany({
      where: whereClause,
      take: Math.ceil(limit / 2),
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.meetingReport.findMany({
      where: whereClause,
      take: Math.ceil(limit / 2),
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  // Combine and sort by creation date
  const activities = [
    ...recentReports.map(report => ({
      type: 'daily_report',
      id: report.id,
      title: `Daily Report - ${report.date.toISOString().split('T')[0]}`,
      user: report.user.name,
      createdAt: report.createdAt,
      data: {
        date: report.date,
        tickets: report.ticketsResolved,
        chats: report.chatsHandled,
      },
    })),
    ...recentMeetings.map(meeting => ({
      type: 'meeting_report',
      id: meeting.id,
      title: meeting.title,
      user: meeting.user.name,
      createdAt: meeting.createdAt,
      data: {
        startTime: meeting.startTime,
        outcome: meeting.outcome,
        attendees: meeting.attendees.length,
      },
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

  return activities;
}

// Helper function to get user-specific stats
async function getUserStats(userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [dailyReports, meetingReports] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
    }),
    prisma.meetingReport.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
        },
      },
    }),
  ]);

  const totalReports = dailyReports.length;
  const totalMeetings = meetingReports.length;

  // Calculate totals
  const totals = dailyReports.reduce(
    (acc, report) => ({
      tickets: acc.tickets + report.ticketsResolved,
      chats: acc.chats + report.chatsHandled,
      githubIssues: acc.githubIssues + report.githubIssues,
      emails: acc.emails + report.emailsProcessed,
      calls: acc.calls + report.callsAttended,
    }),
    { tickets: 0, chats: 0, githubIssues: 0, emails: 0, calls: 0 }
  );

  // Meeting outcomes
  const meetingOutcomes = meetingReports.reduce((acc, meeting) => {
    acc[meeting.outcome] = (acc[meeting.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    period: { days, startDate, endDate: new Date() },
    dailyReports: {
      count: totalReports,
      totals,
      averages: {
        tickets: totalReports > 0 ? Math.round((totals.tickets / totalReports) * 100) / 100 : 0,
        chats: totalReports > 0 ? Math.round((totals.chats / totalReports) * 100) / 100 : 0,
        githubIssues: totalReports > 0 ? Math.round((totals.githubIssues / totalReports) * 100) / 100 : 0,
        emails: totalReports > 0 ? Math.round((totals.emails / totalReports) * 100) / 100 : 0,
        calls: totalReports > 0 ? Math.round((totals.calls / totalReports) * 100) / 100 : 0,
      },
    },
    meetings: {
      count: totalMeetings,
      outcomes: meetingOutcomes,
    },
  };
}

// Helper function to get time series data
async function getDailyReportsTimeSeries(filters: any) {
  const reports = await prisma.dailyReport.findMany({
    where: {
      date: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
      ...(filters.userIds ? { userId: { in: filters.userIds } } : {}),
    },
    select: {
      date: true,
      ticketsResolved: true,
      chatsHandled: true,
      githubIssues: true,
      emailsProcessed: true,
      callsAttended: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Group by date and sum metrics
  const timeSeriesMap = new Map();

  reports.forEach(report => {
    const dateKey = report.date.toISOString().split('T')[0];
    const existing = timeSeriesMap.get(dateKey) || {
      date: dateKey,
      tickets: 0,
      chats: 0,
      githubIssues: 0,
      emails: 0,
      calls: 0,
    };

    existing.tickets += report.ticketsResolved;
    existing.chats += report.chatsHandled;
    existing.githubIssues += report.githubIssues;
    existing.emails += report.emailsProcessed;
    existing.calls += report.callsAttended;

    timeSeriesMap.set(dateKey, existing);
  });

  return Array.from(timeSeriesMap.values());
}

// Helper function to generate CSV
function generateCSV(data: { dailyReports: any[]; meetingReports: any[] }): string {
  const lines: string[] = [];

  // Daily Reports CSV
  lines.push('=== DAILY REPORTS ===');
  lines.push('Date,User,Tickets,Chats,GitHub Issues,Emails,Calls,Notes');

  data.dailyReports.forEach(report => {
    const line = [
      report.date.toISOString().split('T')[0],
      report.user.name,
      report.ticketsResolved,
      report.chatsHandled,
      report.githubIssues,
      report.emailsProcessed,
      report.callsAttended,
      `"${(report.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
    lines.push(line);
  });

  lines.push('');
  lines.push('=== MEETING REPORTS ===');
  lines.push('Title,User,Start Time,End Time,Outcome,Attendees,Action Items');

  data.meetingReports.forEach(meeting => {
    const line = [
      `"${meeting.title.replace(/"/g, '""')}"`,
      meeting.user.name,
      meeting.startTime.toISOString(),
      meeting.endTime ? meeting.endTime.toISOString() : '',
      meeting.outcome,
      meeting.attendees.length,
      meeting.actionItems.length,
    ].join(',');
    lines.push(line);
  });

  return lines.join('\n');
}

export { router as analyticsRoutes };
