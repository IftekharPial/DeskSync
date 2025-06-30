import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Extended User type for NextAuth
export interface ExtendedUser extends User {
  id: string;
  email: string;
  name: string;
  role: 'SUPPORT_AGENT' | 'ADMIN';
  isActive: boolean;
}

// Extended Session type for NextAuth
export interface ExtendedSession extends Session {
  user: ExtendedUser;
}

// Extended JWT type for NextAuth
export interface ExtendedJWT extends JWT {
  id: string;
  email: string;
  name: string;
  role: 'SUPPORT_AGENT' | 'ADMIN';
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Request types
export interface AuthenticatedRequest {
  user: ExtendedUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface FilterQuery {
  search?: string;
  status?: string;
  role?: string;
  userId?: string;
}

// Webhook types
export interface WebhookPayload {
  [key: string]: any;
}

export interface WebhookHeaders {
  [key: string]: string;
}

export interface WebhookDeliveryOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
  duration: number;
  attempt: number;
}

// Template types
export interface TemplateVariable {
  key: string;
  value: any;
}

export interface TemplateContext {
  [key: string]: any;
}

// Analytics types
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, any>;
}

// Queue job types
export interface WebhookDeliveryJob {
  payloadLogId: string;
  endpointId: string;
  payload: WebhookPayload;
  headers?: WebhookHeaders;
  attempt?: number;
}

export interface EmailNotificationJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Logging types
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface RedisConfig {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SlackConfig {
  botToken?: string;
  signingSecret?: string;
  defaultChannel?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'datetime';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  layout?: 'vertical' | 'horizontal';
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: string | Error;
  retry?: () => void;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
