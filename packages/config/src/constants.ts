// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
  WEBHOOKS: {
    BASE: '/api/webhooks',
    CREATE: '/api/webhooks',
    GET_ALL: '/api/webhooks',
    GET_BY_ID: (id: string) => `/api/webhooks/${id}`,
    UPDATE: (id: string) => `/api/webhooks/${id}`,
    DELETE: (id: string) => `/api/webhooks/${id}`,
    RECEIVE: (id: string) => `/api/webhooks/${id}/receive`,
    LOGS: (id: string) => `/api/webhooks/${id}/logs`,
  },
  ENDPOINTS: {
    BASE: '/api/endpoints',
    CREATE: '/api/endpoints',
    GET_ALL: '/api/endpoints',
    GET_BY_ID: (id: string) => `/api/endpoints/${id}`,
    UPDATE: (id: string) => `/api/endpoints/${id}`,
    DELETE: (id: string) => `/api/endpoints/${id}`,
  },
  REPORTS: {
    DAILY: {
      BASE: '/api/reports/daily',
      CREATE: '/api/reports/daily',
      GET_ALL: '/api/reports/daily',
      GET_BY_ID: (id: string) => `/api/reports/daily/${id}`,
      UPDATE: (id: string) => `/api/reports/daily/${id}`,
      DELETE: (id: string) => `/api/reports/daily/${id}`,
    },
    MEETING: {
      BASE: '/api/reports/meeting',
      CREATE: '/api/reports/meeting',
      GET_ALL: '/api/reports/meeting',
      GET_BY_ID: (id: string) => `/api/reports/meeting/${id}`,
      UPDATE: (id: string) => `/api/reports/meeting/${id}`,
      DELETE: (id: string) => `/api/reports/meeting/${id}`,
    },
  },
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    DAILY_REPORTS: '/api/analytics/daily-reports',
    USER_PERFORMANCE: '/api/analytics/user-performance',
    WEBHOOK_ANALYTICS: '/api/analytics/webhook-analytics',
    EXPORT: '/api/analytics/export',
  },
  USERS: {
    BASE: '/api/users',
    GET_ALL: '/api/users',
    GET_BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
} as const;

// Frontend Routes
export const FRONTEND_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  REPORTS: {
    DAILY: '/dashboard/reports',
    MEETING: '/dashboard/meetings',
  },
  ANALYTICS: '/dashboard/analytics',
  ADMIN: {
    BASE: '/dashboard',
    WEBHOOKS: '/dashboard/webhooks',
    USERS: '/dashboard/users',
    LOGS: '/dashboard/logs',
  },
} as const;

// User Roles
export const USER_ROLES = {
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  ADMIN: 'ADMIN',
} as const;

// Webhook Status
export const WEBHOOK_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const;

// Delivery Status
export const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
} as const;

// Meeting Outcomes
export const MEETING_OUTCOMES = {
  SUCCESSFUL: 'SUCCESSFUL',
  CLIENT_ABSENT: 'CLIENT_ABSENT',
  TECHNICAL_ISSUES: 'TECHNICAL_ISSUES',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // 5 login attempts per 15 minutes
  },
  WEBHOOK: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 60, // 60 webhook calls per minute
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DATETIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
} as const;

// Queue Names
export const QUEUE_NAMES = {
  WEBHOOK_DELIVERY: 'webhook-delivery',
  EMAIL_NOTIFICATIONS: 'email-notifications',
  ANALYTICS_PROCESSING: 'analytics-processing',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMITED: 'Too many requests',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  WEBHOOK_NOT_FOUND: 'Webhook not found',
  ENDPOINT_NOT_FOUND: 'Endpoint not found',
  REPORT_NOT_FOUND: 'Report not found',
} as const;
