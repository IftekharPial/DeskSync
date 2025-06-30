import { z } from 'zod';
import { UserRole, WebhookStatus, WebhookType, MeetingOutcome } from './generated';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Webhook validation schemas
export const createWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  type: z.enum(['GENERIC', 'MEETING']).default('GENERIC'),
  secret: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  createdBy: z.string().min(1, 'User ID is required'),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional(),
  type: z.nativeEnum(WebhookType).optional(),
  secret: z.string().optional(),
  status: z.nativeEnum(WebhookStatus).optional(),
});

// Outgoing endpoint validation schemas
export const createEndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required'),
  url: z.string().url('Invalid URL'),
  method: z.string().default('POST'),
  headers: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  retryDelayMs: z.number().int().min(100).max(60000).default(1000),
  timeoutMs: z.number().int().min(1000).max(300000).default(30000),
  incomingWebhookId: z.string().cuid('Invalid webhook ID'),
});

export const updateEndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required').optional(),
  url: z.string().url('Invalid URL').optional(),
  method: z.string().optional(),
  headers: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
  retryDelayMs: z.number().int().min(100).max(60000).optional(),
  timeoutMs: z.number().int().min(1000).max(300000).optional(),
});

// Message template validation schemas
export const createMessageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  template: z.string().min(1, 'Template content is required'),
  description: z.string().optional(),
  outgoingEndpointId: z.string().cuid('Invalid endpoint ID'),
});

export const updateMessageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  template: z.string().min(1, 'Template content is required').optional(),
  description: z.string().optional(),
});

// Platform report schema for daily reports (moved up to avoid temporal dead zone)
export const platformReportSchema = z.object({
  platform: z.string().min(1, 'Platform name is required'),
  ticketsHandled: z.number().int().min(0, 'Tickets handled must be non-negative'),
});

// Daily report validation schemas
export const createDailyReportSchema = z.object({
  date: z.date(),
  ticketsResolved: z.number().int().min(0).default(0),
  chatsHandled: z.number().int().min(0).default(0),
  githubIssues: z.number().int().min(0).default(0),
  emailsProcessed: z.number().int().min(0).default(0),
  callsAttended: z.number().int().min(0).default(0),
  platformReports: z.array(platformReportSchema).optional(),
  notes: z.string().optional(),
  links: z.array(z.string().url()).default([]),
  userId: z.string().cuid('Invalid user ID'),
});

export const updateDailyReportSchema = z.object({
  ticketsResolved: z.number().int().min(0).optional(),
  chatsHandled: z.number().int().min(0).optional(),
  githubIssues: z.number().int().min(0).optional(),
  emailsProcessed: z.number().int().min(0).optional(),
  callsAttended: z.number().int().min(0).optional(),
  platformReports: z.array(platformReportSchema).optional(),
  notes: z.string().optional(),
  links: z.array(z.string().url()).optional(),
});

// Meeting report validation schemas
export const createMeetingReportSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  startTime: z.date(),
  endTime: z.date().optional(),
  outcome: z.nativeEnum(MeetingOutcome),
  notes: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  hostId: z.string().optional(),
  isAssigned: z.boolean().default(true),
  userId: z.string().cuid('Invalid user ID').nullable(),
}).refine(
  (data) => !data.endTime || data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const updateMeetingReportSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  outcome: z.nativeEnum(MeetingOutcome).optional(),
  notes: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  hostId: z.string().optional(),
  isAssigned: z.boolean().optional(),
}).refine(
  (data) => !data.endTime || !data.startTime || data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Support platform validation schemas
export const createSupportPlatformSchema = z.object({
  name: z.string().min(1, 'Platform name is required').max(100, 'Platform name must be less than 100 characters'),
  isActive: z.boolean().default(true),
});

export const updateSupportPlatformSchema = z.object({
  name: z.string().min(1, 'Platform name is required').max(100, 'Platform name must be less than 100 characters').optional(),
  isActive: z.boolean().optional(),
});

// Webhook meeting payload schema
export const webhookMeetingPayloadSchema = z.object({
  meeting_id: z.string().optional(),
  meeting_title: z.string().min(1, 'Meeting title is required'),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  host_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
});

// Analytics filter validation schemas
export const dateRangeFilterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

export const userFilterSchema = z.object({
  userIds: z.array(z.string().cuid()).optional(),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
});

export const webhookFilterSchema = z.object({
  webhookIds: z.array(z.string().cuid()).optional(),
  status: z.array(z.nativeEnum(WebhookStatus)).optional(),
});

// Webhook payload validation (flexible)
export const webhookPayloadSchema = z.record(z.any());

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
export type CreateMessageTemplateInput = z.infer<typeof createMessageTemplateSchema>;
export type UpdateMessageTemplateInput = z.infer<typeof updateMessageTemplateSchema>;
export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>;
export type CreateMeetingReportInput = z.infer<typeof createMeetingReportSchema>;
export type UpdateMeetingReportInput = z.infer<typeof updateMeetingReportSchema>;
export type CreateSupportPlatformInput = z.infer<typeof createSupportPlatformSchema>;
export type UpdateSupportPlatformInput = z.infer<typeof updateSupportPlatformSchema>;
export type PlatformReportInput = z.infer<typeof platformReportSchema>;
export type WebhookMeetingPayload = z.infer<typeof webhookMeetingPayloadSchema>;
export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type WebhookFilter = z.infer<typeof webhookFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
