import { Router } from 'express';
import { prisma, formatDateForDatabase } from '@dailysync/database';
import {
  createDailyReportSchema,
  updateDailyReportSchema,
  paginationSchema,
  dateRangeFilterSchema
} from '@dailysync/database';
import { HTTP_STATUS, PAGINATION } from '@dailysync/config';
import {
  asyncHandler,
  validationError,
  notFoundError,
  forbiddenError,
  conflictError
} from '../middleware/errorHandler';
import { authMiddleware, canAccessUserResources } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Get daily reports with filtering and pagination
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const paginationValidation = paginationSchema.safeParse(req.query);
  const { page, limit } = paginationValidation.success
    ? paginationValidation.data
    : { page: PAGINATION.DEFAULT_PAGE, limit: PAGINATION.DEFAULT_LIMIT };

  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause: any = {};

  // Filter by user (non-admin users can only see their own reports)
  if (req.user?.role !== 'ADMIN') {
    whereClause.userId = req.user!.id;
  } else if (req.query.userId) {
    whereClause.userId = req.query.userId as string;
  }

  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    const dateFilter: any = {};
    if (req.query.startDate) {
      dateFilter.gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      dateFilter.lte = new Date(req.query.endDate as string);
    }
    whereClause.date = dateFilter;
  }

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.dailyReport.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: reports,
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

// Get daily report by ID
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.dailyReport.findUnique({
    where: { id },
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

  if (!report) {
    throw notFoundError('Daily report not found');
  }

  // Non-admin users can only view their own reports
  if (req.user?.role !== 'ADMIN' && report.userId !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  res.json({
    success: true,
    data: report,
  });
}));

// Create new daily report
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const validation = createDailyReportSchema.safeParse({
    ...req.body,
    userId: req.user!.id, // Always use the authenticated user's ID
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });

  if (!validation.success) {
    throw validationError('Invalid daily report data', validation.error.errors);
  }

  const { date, userId, ...reportData } = validation.data;

  // Check if report already exists for this user and date
  const existingReport = await prisma.dailyReport.findUnique({
    where: {
      userId_date: {
        userId,
        date: formatDateForDatabase(date) as any,
      },
    },
  });

  if (existingReport) {
    throw conflictError('Daily report already exists for this date');
  }

  const report = await prisma.dailyReport.create({
    data: {
      ...reportData,
      date: formatDateForDatabase(date) as any,
      userId,
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

  logger.info('Daily report created', {
    reportId: report.id,
    userId: report.userId,
    date: report.date,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: report,
    message: 'Daily report created successfully',
  });
}));

// Update daily report
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.dailyReport.findUnique({
    where: { id },
  });

  if (!report) {
    throw notFoundError('Daily report not found');
  }

  // Non-admin users can only update their own reports
  if (req.user?.role !== 'ADMIN' && report.userId !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const validation = updateDailyReportSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError('Invalid daily report data', validation.error.errors);
  }

  const updatedReport = await prisma.dailyReport.update({
    where: { id },
    data: validation.data,
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

  logger.info('Daily report updated', {
    reportId: id,
    userId: report.userId,
    updatedBy: req.user!.id,
  });

  res.json({
    success: true,
    data: updatedReport,
    message: 'Daily report updated successfully',
  });
}));

// Delete daily report
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.dailyReport.findUnique({
    where: { id },
  });

  if (!report) {
    throw notFoundError('Daily report not found');
  }

  // Non-admin users can only delete their own reports
  if (req.user?.role !== 'ADMIN' && report.userId !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  await prisma.dailyReport.delete({
    where: { id },
  });

  logger.info('Daily report deleted', {
    reportId: id,
    userId: report.userId,
    deletedBy: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Daily report deleted successfully',
  });
}));

// Get daily report for a specific date (current user)
router.get('/date/:date', authMiddleware, asyncHandler(async (req, res) => {
  const { date } = req.params;
  const userId = req.user!.id;

  let reportDate: Date;
  try {
    reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch {
    throw validationError('Invalid date format. Use YYYY-MM-DD');
  }

  const report = await prisma.dailyReport.findUnique({
    where: {
      userId_date: {
        userId,
        date: formatDateForDatabase(reportDate) as any,
      },
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

  if (!report) {
    return res.json({
      success: true,
      data: null,
      message: 'No report found for this date',
    });
  }

  res.json({
    success: true,
    data: report,
  });
}));

// Get user's daily report statistics
router.get('/stats/summary', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId,
      date: {
        gte: formatDateForDatabase(startDate) as any,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Calculate statistics
  const totalReports = reports.length;
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

  const averages = {
    tickets: totalReports > 0 ? Math.round((totals.tickets / totalReports) * 100) / 100 : 0,
    chats: totalReports > 0 ? Math.round((totals.chats / totalReports) * 100) / 100 : 0,
    githubIssues: totalReports > 0 ? Math.round((totals.githubIssues / totalReports) * 100) / 100 : 0,
    emails: totalReports > 0 ? Math.round((totals.emails / totalReports) * 100) / 100 : 0,
    calls: totalReports > 0 ? Math.round((totals.calls / totalReports) * 100) / 100 : 0,
  };

  // Get streak information
  const today = new Date();
  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check consecutive days with reports
  while (currentStreak < 365) { // Max check 1 year
    const dateStr = formatDateForDatabase(checkDate);
    const hasReport = reports.some(r =>
      formatDateForDatabase(new Date(r.date)) === dateStr
    );

    if (hasReport) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  res.json({
    success: true,
    data: {
      period: {
        days,
        startDate: formatDateForDatabase(startDate),
        endDate: formatDateForDatabase(today),
      },
      totals,
      averages,
      reportCount: totalReports,
      currentStreak,
      recentReports: reports.slice(0, 7), // Last 7 reports
    },
  });
}));

// Bulk create/update daily reports
router.post('/bulk', authMiddleware, asyncHandler(async (req, res) => {
  const { reports } = req.body;

  if (!Array.isArray(reports) || reports.length === 0) {
    throw validationError('Reports array is required and must not be empty');
  }

  if (reports.length > 31) { // Max 31 days at once
    throw validationError('Cannot process more than 31 reports at once');
  }

  const userId = req.user!.id;
  const results = [];
  const errors = [];

  for (let i = 0; i < reports.length; i++) {
    try {
      const reportData = reports[i];
      const validation = createDailyReportSchema.safeParse({
        ...reportData,
        userId,
        date: reportData.date ? new Date(reportData.date) : new Date(),
      });

      if (!validation.success) {
        errors.push({
          index: i,
          date: reportData.date,
          errors: validation.error.errors,
        });
        continue;
      }

      const { date, ...data } = validation.data;
      const formattedDate = formatDateForDatabase(date) as any;

      // Try to upsert (create or update)
      const report = await prisma.dailyReport.upsert({
        where: {
          userId_date: {
            userId,
            date: formattedDate,
          },
        },
        update: data,
        create: {
          ...data,
          date: formattedDate,
          userId,
        },
      });

      results.push(report);

    } catch (error) {
      errors.push({
        index: i,
        date: reports[i].date,
        error: error.message,
      });
    }
  }

  logger.info('Bulk daily reports processed', {
    userId,
    totalReports: reports.length,
    successful: results.length,
    failed: errors.length,
  });

  res.json({
    success: true,
    data: {
      created: results,
      errors,
      summary: {
        total: reports.length,
        successful: results.length,
        failed: errors.length,
      },
    },
    message: `Processed ${results.length} reports successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
  });
}));

export { router as dailyReportRoutes };
