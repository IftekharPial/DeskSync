import { Router } from 'express';
import { authRoutes } from './auth';
import { webhookRoutes } from './webhooks';
import { endpointRoutes } from './endpoints';
import { dailyReportRoutes } from './dailyReports';
import { meetingReportRoutes } from './meetingReports';
import { analyticsRoutes } from './analytics';
import { userRoutes } from './users';
import { healthRoutes } from './health';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/endpoints', endpointRoutes);
router.use('/reports/daily', dailyReportRoutes);
router.use('/reports/meeting', meetingReportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);

export { router as routes };
