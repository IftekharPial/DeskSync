import { PrismaClient } from './generated';

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Export Prisma client and core types (selective imports to avoid declaration emit issues)
export { PrismaClient } from './generated';

// Re-export types individually to avoid Prisma internal type conflicts
export type {
  User,
  IncomingWebhook,
  MessageTemplate,
  DailyReport,
  MeetingReport,
  SupportPlatform
} from './generated';

// Re-export enums as values (provides both type and runtime access)
export {
  UserRole,
  WebhookType,
  WebhookStatus,
  MeetingOutcome
} from './generated';

// Export Prisma namespace types selectively
export type { Prisma } from './generated';

// Export custom types (explicit named exports to avoid conflicts)
export type {
  UserWithoutPassword,
  CreateUserInput,
  UpdateUserInput,
  CreateWebhookInput,
  UpdateWebhookInput,
  CreateDailyReportInput,
  UpdateDailyReportInput,
  CreateMeetingReportInput,
  UpdateMeetingReportInput,
  CreateSupportPlatformInput,
  UpdateSupportPlatformInput,
  PlatformReport,
  DailyReportWithPlatforms,
  DailyReportAnalytics,
  UserPerformanceMetrics,
  WebhookAnalytics,
  DateRangeFilter,
  UserFilter,
  WebhookFilter
} from './types';

// Export utilities and validations
export * from './utils';
export * from './validations';
