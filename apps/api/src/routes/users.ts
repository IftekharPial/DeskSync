import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Placeholder routes - will be implemented later
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'User routes - to be implemented',
  });
}));

export { router as userRoutes };
