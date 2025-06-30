import { Router } from 'express';
import { prisma } from '@dailysync/database';
import {
  createMeetingReportSchema,
  updateMeetingReportSchema,
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
import { logger } from '../utils/logger';

const router = Router();

// Get meeting reports with filtering and pagination
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
    whereClause.startTime = dateFilter;
  }

  // Filter by outcome
  if (req.query.outcome) {
    whereClause.outcome = req.query.outcome;
  }

  const [reports, total] = await Promise.all([
    prisma.meetingReport.findMany({
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
        startTime: 'desc',
      },
    }),
    prisma.meetingReport.count({
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

// Get meeting report by ID
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.meetingReport.findUnique({
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
    throw notFoundError('Meeting report not found');
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

// Create new meeting report
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const validation = createMeetingReportSchema.safeParse({
    ...req.body,
    userId: req.user!.id, // Always use the authenticated user's ID
    startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
  });

  if (!validation.success) {
    throw validationError('Invalid meeting report data', validation.error.errors);
  }

  const report = await prisma.meetingReport.create({
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

  logger.info('Meeting report created', {
    reportId: report.id,
    userId: report.userId,
    title: report.title,
    outcome: report.outcome,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: report,
    message: 'Meeting report created successfully',
  });
}));

// Update meeting report
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.meetingReport.findUnique({
    where: { id },
  });

  if (!report) {
    throw notFoundError('Meeting report not found');
  }

  // Non-admin users can only update their own reports
  if (req.user?.role !== 'ADMIN' && report.userId !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  const validation = updateMeetingReportSchema.safeParse({
    ...req.body,
    startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
  });

  if (!validation.success) {
    throw validationError('Invalid meeting report data', validation.error.errors);
  }

  const updatedReport = await prisma.meetingReport.update({
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

  logger.info('Meeting report updated', {
    reportId: id,
    userId: report.userId,
    updatedBy: req.user!.id,
  });

  res.json({
    success: true,
    data: updatedReport,
    message: 'Meeting report updated successfully',
  });
}));

// Delete meeting report
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await prisma.meetingReport.findUnique({
    where: { id },
  });

  if (!report) {
    throw notFoundError('Meeting report not found');
  }

  // Non-admin users can only delete their own reports
  if (req.user?.role !== 'ADMIN' && report.userId !== req.user?.id) {
    throw forbiddenError('Access denied');
  }

  await prisma.meetingReport.delete({
    where: { id },
  });

  logger.info('Meeting report deleted', {
    reportId: id,
    userId: report.userId,
    deletedBy: req.user!.id,
  });

  res.json({
    success: true,
    message: 'Meeting report deleted successfully',
  });
}));

// Get meeting statistics
router.get('/stats/summary', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const reports = await prisma.meetingReport.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  // Calculate statistics
  const totalMeetings = reports.length;
  const outcomeStats = reports.reduce((acc, report) => {
    acc[report.outcome] = (acc[report.outcome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total meeting time
  const totalMinutes = reports.reduce((acc, report) => {
    if (report.endTime) {
      const duration = report.endTime.getTime() - report.startTime.getTime();
      return acc + (duration / (1000 * 60)); // Convert to minutes
    }
    return acc;
  }, 0);

  const averageDuration = totalMeetings > 0 ? Math.round(totalMinutes / totalMeetings) : 0;

  // Get recent meetings
  const recentMeetings = reports.slice(0, 5);

  res.json({
    success: true,
    data: {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      totalMeetings,
      outcomeStats,
      totalMinutes: Math.round(totalMinutes),
      averageDuration,
      recentMeetings,
    },
  });
}));

export { router as meetingReportRoutes };
