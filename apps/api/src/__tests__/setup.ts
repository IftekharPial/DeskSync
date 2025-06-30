import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@dailysync/database'
import { execSync } from 'child_process'
import { Redis } from 'ioredis'
import { env } from '@dailysync/config'

// Test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.TEST_DATABASE_URL || env.DATABASE_URL,
    },
  },
})

// Test Redis instance
const redis = new Redis(env.TEST_REDIS_URL || env.REDIS_URL)

// Global test setup
beforeAll(async () => {
  // Reset test database
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: { ...process.env, DATABASE_URL: env.TEST_DATABASE_URL || env.DATABASE_URL },
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('Failed to reset database, continuing with existing state')
  }

  // Run migrations
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: env.TEST_DATABASE_URL || env.DATABASE_URL },
      stdio: 'inherit',
    })
  } catch (error) {
    console.error('Failed to run migrations:', error)
    throw error
  }

  // Clear Redis
  await redis.flushall()
})

// Clean up after each test
afterEach(async () => {
  // Clean up database tables in reverse dependency order
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }

  // Clear Redis
  await redis.flushall()
})

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect()
  await redis.quit()
})

// Test utilities
export const testUtils = {
  prisma,
  redis,
  
  // Create test user
  createTestUser: async (overrides = {}) => {
    return await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'USER',
        isActive: true,
        ...overrides,
      },
    })
  },

  // Create test admin
  createTestAdmin: async (overrides = {}) => {
    return await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'hashedpassword',
        role: 'ADMIN',
        isActive: true,
        ...overrides,
      },
    })
  },

  // Create test daily report
  createTestDailyReport: async (userId: string, overrides = {}) => {
    return await prisma.dailyReport.create({
      data: {
        userId,
        date: new Date(),
        ticketsResolved: 5,
        chatsHandled: 10,
        githubIssues: 2,
        emailsProcessed: 15,
        callsAttended: 3,
        notes: 'Test notes',
        ...overrides,
      },
    })
  },

  // Create test meeting report
  createTestMeetingReport: async (userId: string, overrides = {}) => {
    return await prisma.meetingReport.create({
      data: {
        userId,
        title: 'Test Meeting',
        startTime: new Date(),
        outcome: 'SUCCESSFUL',
        notes: 'Test meeting notes',
        attendees: ['test@example.com'],
        actionItems: ['Test action item'],
        ...overrides,
      },
    })
  },

  // Create test webhook
  createTestWebhook: async (overrides = {}) => {
    return await prisma.incomingWebhook.create({
      data: {
        name: 'Test Webhook',
        url: 'https://example.com/webhook/test',
        secret: 'test-secret',
        status: 'ACTIVE',
        ...overrides,
      },
    })
  },

  // Create test outgoing endpoint
  createTestEndpoint: async (webhookId: string, overrides = {}) => {
    return await prisma.outgoingEndpoint.create({
      data: {
        incomingWebhookId: webhookId,
        url: 'https://example.com/endpoint',
        method: 'POST',
        isActive: true,
        ...overrides,
      },
    })
  },

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test JWT token
  generateTestToken: (userId: string) => {
    const jwt = require('jsonwebtoken')
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '1h' })
  },
}

// Mock external services
export const mockServices = {
  // Mock webhook delivery
  mockWebhookDelivery: jest.fn().mockResolvedValue({
    status: 200,
    body: 'OK',
    responseTime: 100,
  }),

  // Mock email service
  mockEmailService: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    success: true,
  }),

  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    mockServices.mockWebhookDelivery.mockResolvedValue({
      status: 200,
      body: 'OK',
      responseTime: 100,
    })
    mockServices.mockEmailService.mockResolvedValue({
      messageId: 'test-message-id',
      success: true,
    })
  },
}

// Test data factories
export const factories = {
  user: (overrides = {}) => ({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'USER',
    isActive: true,
    ...overrides,
  }),

  admin: (overrides = {}) => ({
    name: 'Test Admin',
    email: `admin-${Date.now()}@example.com`,
    password: 'password123',
    role: 'ADMIN',
    isActive: true,
    ...overrides,
  }),

  dailyReport: (userId: string, overrides = {}) => ({
    userId,
    date: new Date(),
    ticketsResolved: Math.floor(Math.random() * 10),
    chatsHandled: Math.floor(Math.random() * 20),
    githubIssues: Math.floor(Math.random() * 5),
    emailsProcessed: Math.floor(Math.random() * 30),
    callsAttended: Math.floor(Math.random() * 8),
    notes: 'Test daily report notes',
    ...overrides,
  }),

  meetingReport: (userId: string, overrides = {}) => ({
    userId,
    title: `Test Meeting ${Date.now()}`,
    startTime: new Date(),
    outcome: 'SUCCESSFUL',
    notes: 'Test meeting notes',
    attendees: ['attendee@example.com'],
    actionItems: ['Test action item'],
    ...overrides,
  }),

  webhook: (overrides = {}) => ({
    name: `Test Webhook ${Date.now()}`,
    url: `https://example.com/webhook/${Date.now()}`,
    secret: `secret-${Date.now()}`,
    status: 'ACTIVE',
    ...overrides,
  }),

  endpoint: (webhookId: string, overrides = {}) => ({
    incomingWebhookId: webhookId,
    url: `https://example.com/endpoint/${Date.now()}`,
    method: 'POST',
    isActive: true,
    ...overrides,
  }),
}

// Custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      }
    }
  },

  toBeValidDate(received) {
    const date = new Date(received)
    const pass = !isNaN(date.getTime())
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      }
    }
  },
})

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R
      toBeValidDate(): R
    }
  }
}
