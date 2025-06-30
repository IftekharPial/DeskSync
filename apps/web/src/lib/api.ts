import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { getSession } from 'next-auth/react'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  // Use relative paths for production to avoid CORS issues
  const baseURL = process.env.NODE_ENV === 'production'
    ? '/api'
    : '/api'

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      const session = await getSession()
      if (session?.user) {
        // Assuming the session contains a token
        const token = (session as any).token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/login', credentials),
  
  register: (userData: { email: string; name: string; password: string; role?: string }) =>
    apiClient.post<ApiResponse<any>>('/auth/register', userData),
  
  me: () =>
    apiClient.get<ApiResponse<any>>('/auth/me'),
  
  logout: () =>
    apiClient.post<ApiResponse<any>>('/auth/logout'),
  
  refresh: () =>
    apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/refresh'),
}

// Webhooks API
export const webhooksApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any>>('/webhooks', { params }),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/webhooks/${id}`),
  
  create: (data: { name: string; description?: string; type?: string; secret?: string; status?: string }) =>
    apiClient.post<ApiResponse<any>>('/webhooks', data),
  
  update: (id: string, data: Partial<{ name: string; description?: string; type?: string; secret?: string; status: string }>) =>
    apiClient.put<ApiResponse<any>>(`/webhooks/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/webhooks/${id}`),
  
  getLogs: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any>>(`/webhooks/${id}/logs`, { params }),
  
  getStats: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/webhooks/${id}/stats`),

  test: (id: string, payload?: any) =>
    apiClient.post<ApiResponse<any>>(`/webhooks/${id}/test`, payload || {}),
}

// Endpoints API
export const endpointsApi = {
  getAll: (params: { webhookId: string }) =>
    apiClient.get<ApiResponse<any[]>>('/endpoints', { params }),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/endpoints/${id}`),
  
  create: (data: {
    name: string
    url: string
    method?: string
    headers?: Record<string, string>
    incomingWebhookId: string
    retryAttempts?: number
    retryDelayMs?: number
    timeoutMs?: number
  }) =>
    apiClient.post<ApiResponse<any>>('/endpoints', data),
  
  update: (id: string, data: Partial<{
    name: string
    url: string
    method: string
    headers: Record<string, string>
    isActive: boolean
    retryAttempts: number
    retryDelayMs: number
    timeoutMs: number
  }>) =>
    apiClient.put<ApiResponse<any>>(`/endpoints/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/endpoints/${id}`),
  
  createTemplate: (id: string, data: { name: string; template: string; description?: string }) =>
    apiClient.post<ApiResponse<any>>(`/endpoints/${id}/template`, data),
  
  updateTemplate: (id: string, data: { name?: string; template?: string; description?: string }) =>
    apiClient.post<ApiResponse<any>>(`/endpoints/${id}/template`, data),
  
  deleteTemplate: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/endpoints/${id}/template`),
  
  getLogs: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any>>(`/endpoints/${id}/logs`, { params }),
  
  test: (id: string, payload?: any) =>
    apiClient.post<ApiResponse<any>>(`/endpoints/${id}/test`, { payload }),
}

// Daily Reports API
export const dailyReportsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    userId?: string
    startDate?: string
    endDate?: string
  }) =>
    apiClient.get<PaginatedResponse<any>>('/reports/daily', { params }),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/reports/daily/${id}`),
  
  getByDate: (date: string) =>
    apiClient.get<ApiResponse<any>>(`/reports/daily/date/${date}`),
  
  create: (data: {
    date?: string
    ticketsResolved?: number
    chatsHandled?: number
    githubIssues?: number
    emailsProcessed?: number
    callsAttended?: number
    platformReports?: Array<{
      platform: string
      ticketsHandled: number
    }>
    notes?: string
    links?: string[]
  }) =>
    apiClient.post<ApiResponse<any>>('/reports/daily', data),
  
  update: (id: string, data: Partial<{
    ticketsResolved: number
    chatsHandled: number
    githubIssues: number
    emailsProcessed: number
    callsAttended: number
    platformReports: Array<{
      platform: string
      ticketsHandled: number
    }>
    notes: string
    links: string[]
  }>) =>
    apiClient.put<ApiResponse<any>>(`/reports/daily/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/reports/daily/${id}`),
  
  getStats: (params?: { days?: number }) =>
    apiClient.get<ApiResponse<any>>('/reports/daily/stats/summary', { params }),
  
  bulkCreate: (reports: any[]) =>
    apiClient.post<ApiResponse<any>>('/reports/daily/bulk', { reports }),
}

// Meeting Reports API
export const meetingReportsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    userId?: string
    startDate?: string
    endDate?: string
    outcome?: string
  }) =>
    apiClient.get<PaginatedResponse<any>>('/reports/meeting', { params }),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/reports/meeting/${id}`),
  
  create: (data: {
    title: string
    startTime: string
    endTime?: string
    outcome: string
    notes?: string
    attendees?: string[]
    actionItems?: string[]
    customerName?: string
    customerEmail?: string
    hostId?: string
    isAssigned?: boolean
  }) =>
    apiClient.post<ApiResponse<any>>('/reports/meeting', data),
  
  update: (id: string, data: Partial<{
    title: string
    startTime: string
    endTime: string
    outcome: string
    notes: string
    attendees: string[]
    actionItems: string[]
    customerName: string
    customerEmail: string
    hostId: string
    isAssigned: boolean
  }>) =>
    apiClient.put<ApiResponse<any>>(`/reports/meeting/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/reports/meeting/${id}`),
  
  getStats: (params?: { days?: number }) =>
    apiClient.get<ApiResponse<any>>('/reports/meeting/stats/summary', { params }),
}

// Analytics API
export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<any>>('/analytics/dashboard'),
  
  getDailyReports: (params?: {
    startDate?: string
    endDate?: string
    userIds?: string
    roles?: string
  }) =>
    apiClient.get<ApiResponse<any>>('/analytics/daily-reports', { params }),
  
  getUserPerformance: (params?: {
    startDate?: string
    endDate?: string
    userIds?: string
    roles?: string
  }) =>
    apiClient.get<ApiResponse<any>>('/analytics/user-performance', { params }),
  
  getWebhookAnalytics: (params?: {
    startDate?: string
    endDate?: string
    webhookIds?: string
    status?: string
  }) =>
    apiClient.get<ApiResponse<any>>('/analytics/webhook-analytics', { params }),
  
  export: (params: {
    format: 'json' | 'csv'
    startDate?: string
    endDate?: string
  }) =>
    apiClient.get('/analytics/export', { 
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    }),
}

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<any>>('/users', { params }),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/users/${id}`),
  
  update: (id: string, data: Partial<{
    name: string
    email: string
    role: string
    isActive: boolean
  }>) =>
    apiClient.put<ApiResponse<any>>(`/users/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/users/${id}`),
}
