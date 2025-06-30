import { Router } from 'express';
import { prisma, hashPassword, verifyPassword, excludePassword } from '@dailysync/database';
import { loginSchema, createUserSchema } from '@dailysync/database';
import { HTTP_STATUS } from '@dailysync/config';
import { asyncHandler, validationError, unauthorizedError, conflictError } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authMiddleware, generateToken } from '../middleware/auth';
import { logAuth } from '../utils/logger';

const router = Router();

// Apply auth rate limiting to all auth routes
router.use(authRateLimiter);

// Login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  // Validate request body
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError('Invalid login data', validation.error.errors);
  }

  const { email, password } = validation.data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    logAuth('login_failed', undefined, email, false);
    throw unauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    logAuth('login_failed_inactive', user.id, email, false);
    throw unauthorizedError('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    logAuth('login_failed', user.id, email, false);
    throw unauthorizedError('Invalid email or password');
  }

  // Generate JWT token
  const userWithoutPassword = excludePassword(user);
  const token = generateToken(userWithoutPassword as any);

  logAuth('login_success', user.id, email, true);

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
    },
    message: 'Login successful',
  });
}));

// Register endpoint (admin only for creating new users)
router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
  // Only admins can create new users
  if (req.user?.role !== 'ADMIN') {
    throw unauthorizedError('Only administrators can create new users');
  }

  // Validate request body
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError('Invalid user data', validation.error.errors);
  }

  const { email, name, password, role, isActive } = validation.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw conflictError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role,
      isActive,
    },
  });

  const userWithoutPassword = excludePassword(newUser);

  logAuth('user_created', newUser.id, email, true);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: userWithoutPassword,
    message: 'User created successfully',
  });
}));

// Get current user endpoint
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
}));

// Logout endpoint (client-side token removal, but we can log it)
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  logAuth('logout', req.user?.id, req.user?.email, true);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// Refresh token endpoint
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user || !user.isActive) {
    throw unauthorizedError('User not found or inactive');
  }

  // Generate new token
  const userWithoutPassword = excludePassword(user);
  const token = generateToken(userWithoutPassword as any);

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
    },
    message: 'Token refreshed successfully',
  });
}));

export { router as authRoutes };
