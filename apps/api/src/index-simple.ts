import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Mock data generators
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateDate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'admin@dailysync.com',
    name: 'Admin User',
    role: 'ADMIN',
    isActive: true,
    createdAt: generateDate(30),
    externalUserId: 'admin_ext_001',
    preferences: {
      sendDailyReportToSlack: true,
      sendMeetingReportToSlack: true,
      preferredLanguage: 'en',
      emailNotifications: true,
      slackNotifications: true,
      timezone: 'UTC'
    }
  },
  {
    id: '2',
    email: 'john.doe@dailysync.com',
    name: 'John Doe',
    role: 'SUPPORT_AGENT',
    isActive: true,
    createdAt: generateDate(25),
    externalUserId: '12345',
    preferences: {
      sendDailyReportToSlack: true,
      sendMeetingReportToSlack: false,
      preferredLanguage: 'en',
      emailNotifications: true,
      slackNotifications: true,
      timezone: 'America/New_York'
    }
  },
  {
    id: '3',
    email: 'jane.smith@dailysync.com',
    name: 'Jane Smith',
    role: 'SUPPORT_AGENT',
    isActive: true,
    createdAt: generateDate(20),
    externalUserId: 'jane_ext_003',
    preferences: {
      sendDailyReportToSlack: false,
      sendMeetingReportToSlack: true,
      preferredLanguage: 'en',
      emailNotifications: false,
      slackNotifications: true,
      timezone: 'Europe/London'
    }
  },
  {
    id: '4',
    email: 'mike.wilson@dailysync.com',
    name: 'Mike Wilson',
    role: 'SUPPORT_AGENT',
    isActive: false,
    createdAt: generateDate(15),
    externalUserId: 'mike_ext_004',
    preferences: {
      sendDailyReportToSlack: true,
      sendMeetingReportToSlack: true,
      preferredLanguage: 'en',
      emailNotifications: true,
      slackNotifications: false,
      timezone: 'America/Los_Angeles'
    }
  },
];

const mockWebhooks = [
  {
    id: '1',
    name: 'Slack Notifications',
    description: 'Send notifications to Slack',
    url: '/api/webhooks/1/receive',
    secret: 'slack_secret_123',
    status: 'ACTIVE',
    type: 'GENERIC',
    createdAt: generateDate(10),
    createdBy: '1'
  },
  {
    id: '2',
    name: 'Meeting Webhook - Slack',
    description: 'Auto-create meetings and notify Slack',
    url: '/api/webhooks/2/receive',
    secret: 'meeting_secret_456',
    status: 'ACTIVE',
    type: 'MEETING',
    createdAt: generateDate(8),
    createdBy: '1'
  },
  {
    id: '3',
    name: 'Email Alerts',
    description: 'Email notification system',
    url: '/api/webhooks/3/receive',
    secret: 'email_secret_789',
    status: 'INACTIVE',
    type: 'GENERIC',
    createdAt: generateDate(5),
    createdBy: '2'
  },
  {
    id: '4',
    name: 'Meeting Webhook - Teams',
    description: 'Auto-create meetings and notify Teams',
    url: '/api/webhooks/4/receive',
    secret: 'meeting_teams_123',
    status: 'ACTIVE',
    type: 'MEETING',
    createdAt: generateDate(3),
    createdBy: '1'
  },
];

const mockDailyReports = [
  { id: '1', date: generateDate(0).split('T')[0], ticketsResolved: 8, chatsHandled: 15, githubIssues: 3, emailsProcessed: 22, callsAttended: 5, notes: 'Productive day with good customer feedback', links: ['https://github.com/issue/123'], userId: '2', createdAt: generateDate(0) },
  { id: '2', date: generateDate(1).split('T')[0], ticketsResolved: 12, chatsHandled: 18, githubIssues: 2, emailsProcessed: 28, callsAttended: 7, notes: 'Handled complex technical issues', links: ['https://github.com/issue/124', 'https://docs.example.com'], userId: '2', createdAt: generateDate(1) },
  { id: '3', date: generateDate(2).split('T')[0], ticketsResolved: 6, chatsHandled: 10, githubIssues: 1, emailsProcessed: 15, callsAttended: 3, notes: 'Focused on documentation updates', links: [], userId: '3', createdAt: generateDate(2) },
];

const mockMeetingReports = [
  { id: '1', title: 'Daily Standup', startTime: generateDate(0), endTime: generateDate(0), outcome: 'SUCCESSFUL', notes: 'Team sync went well, discussed current sprint progress', attendees: ['john.doe@dailysync.com', 'jane.smith@dailysync.com'], actionItems: ['Update documentation', 'Review pull requests'], userId: '2', createdAt: generateDate(0) },
  { id: '2', title: 'Client Onboarding Call', startTime: generateDate(1), endTime: generateDate(1), outcome: 'SUCCESSFUL', notes: 'Successfully onboarded new client, walked through platform features', attendees: ['client@example.com', 'john.doe@dailysync.com'], actionItems: ['Send follow-up email', 'Schedule training session'], userId: '2', createdAt: generateDate(1) },
  { id: '3', title: 'Technical Review', startTime: generateDate(2), endTime: generateDate(2), outcome: 'RESCHEDULED', notes: 'Client had technical difficulties, rescheduled for tomorrow', attendees: ['tech-lead@example.com'], actionItems: ['Test client connection', 'Prepare backup plan'], userId: '3', createdAt: generateDate(2) },
];

const mockEndpoints = [
  {
    id: '1',
    name: 'Slack Channel',
    url: 'https://hooks.slack.com/services/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',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isActive: true,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    incomingWebhookId: '1',
    type: 'SLACK',
    messageTemplateId: '1',
    createdAt: generateDate(10)
  },
  {
    id: '2',
    name: 'Teams Webhook',
    url: 'https://outlook.office.com/webhook/xxxxx',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isActive: true,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    incomingWebhookId: '2',
    type: 'TEAMS',
    messageTemplateId: '5',
    createdAt: generateDate(8)
  },
  {
    id: '3',
    name: 'Google Sheets Integration',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/1234567890/values/Sheet1:append',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock_token' },
    isActive: true,
    retryAttempts: 2,
    retryDelayMs: 2000,
    timeoutMs: 45000,
    incomingWebhookId: '1',
    type: 'GOOGLE_SHEETS',
    messageTemplateId: '3',
    createdAt: generateDate(5)
  },
  {
    id: '4',
    name: 'Meeting Slack Channel',
    url: 'https://hooks.slack.com/services/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',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isActive: true,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    incomingWebhookId: '2',
    type: 'SLACK',
    messageTemplateId: '4',
    createdAt: generateDate(6)
  },
  {
    id: '5',
    name: 'Meeting Teams Channel',
    url: 'https://outlook.office.com/webhook/meeting_teams_hook',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isActive: true,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    incomingWebhookId: '4',
    type: 'TEAMS',
    messageTemplateId: '5',
    createdAt: generateDate(4)
  },
];

const mockMessageTemplates = [
  {
    id: '1',
    name: 'Slack Daily Report Template',
    template: '🎯 Daily Report from {{userName}}\n📊 Tickets: {{ticketsResolved}}\n💬 Chats: {{chatsHandled}}\n📧 Emails: {{emailsProcessed}}\n📞 Calls: {{callsAttended}}\n🐛 GitHub Issues: {{githubIssues}}\n📝 Notes: {{notes}}',
    type: 'SLACK',
    webhookType: 'GENERIC',
    createdAt: generateDate(10)
  },
  {
    id: '2',
    name: 'Teams Meeting Template',
    template: '🤝 Meeting Report: {{title}}\n👤 Host: {{userName}}\n⏰ Duration: {{duration}}\n✅ Outcome: {{outcome}}\n📝 Notes: {{notes}}\n🎯 Action Items: {{actionItems}}',
    type: 'API',
    webhookType: 'GENERIC',
    createdAt: generateDate(8)
  },
  {
    id: '3',
    name: 'Google Sheets Row Template',
    template: '{{date}},{{userName}},{{ticketsResolved}},{{chatsHandled}},{{emailsProcessed}},{{callsAttended}},{{githubIssues}}',
    type: 'GOOGLE_SHEETS',
    webhookType: 'GENERIC',
    createdAt: generateDate(5)
  },
  {
    id: '4',
    name: 'Meeting Slack Notification',
    template: '🚀 *New Meeting Created: {{meetingTitle}}*\n🕑 {{startTimeFormatted}}\n👤 Client: {{clientName}}\n📝 {{notes}}\n🔗 Meeting ID: {{meetingId}}',
    type: 'SLACK',
    webhookType: 'MEETING',
    createdAt: generateDate(6)
  },
  {
    id: '5',
    name: 'Meeting Teams Notification',
    template: '🚀 **New Meeting Created: {{meetingTitle}}**\n\n🕑 **Time:** {{startTimeFormatted}}\n👤 **Client:** {{clientName}}\n📝 **Notes:** {{notes}}\n🔗 **Meeting ID:** {{meetingId}}',
    type: 'TEAMS',
    webhookType: 'MEETING',
    createdAt: generateDate(4)
  }
];

const mockLogs = [
  { id: '1', payload: { message: 'Daily report submitted', user: 'john.doe@dailysync.com' }, headers: { 'user-agent': 'DailySync/1.0' }, userAgent: 'DailySync/1.0', ipAddress: '192.168.1.100', receivedAt: generateDate(0), incomingWebhookId: '1', status: 'SUCCESS', response: { statusCode: 200, message: 'Delivered successfully' } },
  { id: '2', payload: { message: 'Meeting completed', meeting: 'Daily Standup' }, headers: { 'user-agent': 'DailySync/1.0' }, userAgent: 'DailySync/1.0', ipAddress: '192.168.1.101', receivedAt: generateDate(1), incomingWebhookId: '1', status: 'SUCCESS', response: { statusCode: 200, message: 'Delivered successfully' } },
  { id: '3', payload: { hostId: 'john_ext_002', meetingTitle: 'Client Demo', outcome: 'SUCCESSFUL' }, headers: { 'user-agent': 'External/1.0' }, userAgent: 'External/1.0', ipAddress: '192.168.1.102', receivedAt: generateDate(0), incomingWebhookId: '2', status: 'SUCCESS', response: { statusCode: 200, message: 'Meeting auto-assigned' } },
];

// Template processing function
const processTemplate = (template: string, data: any) => {
  let processed = template;

  // Handle array fields like attendees and actionItems
  const processedData = { ...data };
  if (Array.isArray(processedData.attendees)) {
    processedData.attendees = processedData.attendees.join(', ');
  }
  if (Array.isArray(processedData.actionItems)) {
    processedData.actionItems = processedData.actionItems.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n');
  }

  // Replace template variables
  Object.keys(processedData).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, processedData[key] || '');
  });

  // Clean up any remaining template variables
  processed = processed.replace(/{{[^}]+}}/g, '');

  return processed;
};

// Real webhook delivery implementation
const deliverToEndpoint = async (endpoint: any, payload: any) => {
  const startTime = Date.now();
  console.log(`🚀 Delivering to ${endpoint.name} (${endpoint.type}): ${endpoint.url}`);

  // Find template
  const template = mockMessageTemplates.find(t => t.id === endpoint.messageTemplateId);
  let processedMessage = payload;
  let formattedPayload = {};

  if (template) {
    console.log(`📝 Using template: ${template.name}`);
    processedMessage = processTemplate(template.template, payload);

    // Format payload based on endpoint type
    switch (endpoint.type) {
      case 'SLACK':
        formattedPayload = {
          text: processedMessage,
          username: 'DailySync Bot',
          icon_emoji: ':robot_face:'
        };
        break;
      case 'TEAMS':
        formattedPayload = {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          text: processedMessage,
          themeColor: '0076D7'
        };
        break;
      case 'GOOGLE_SHEETS':
        formattedPayload = {
          values: [processedMessage.split(',')]
        };
        break;
      default:
        formattedPayload = { message: processedMessage };
    }
  } else {
    formattedPayload = payload;
  }

  // Make actual HTTP request to the endpoint
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(endpoint.url, {
      method: endpoint.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DailySync-Webhook/1.0',
        ...endpoint.headers
      },
      body: JSON.stringify(formattedPayload),
      timeout: endpoint.timeoutMs || 30000
    });

    const responseText = await response.text();
    const duration = Date.now() - startTime;

    if (response.ok) {
      console.log(`✅ Successfully delivered to ${endpoint.name} (${response.status}) in ${duration}ms`);
      return {
        success: true,
        statusCode: response.status,
        message: 'Delivered successfully',
        responseBody: responseText,
        processedMessage,
        formattedPayload,
        templateUsed: template?.name || 'No template',
        duration
      };
    } else {
      console.log(`❌ Failed to deliver to ${endpoint.name} (${response.status}): ${responseText}`);
      return {
        success: false,
        statusCode: response.status,
        message: `HTTP ${response.status}: ${responseText}`,
        responseBody: responseText,
        processedMessage,
        formattedPayload,
        templateUsed: template?.name || 'No template',
        duration
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed to deliver to ${endpoint.name}: ${error.message}`);
    return {
      success: false,
      statusCode: 0,
      message: `Network error: ${error.message}`,
      error: error.message,
      processedMessage,
      formattedPayload,
      templateUsed: template?.name || 'No template',
      duration
    };
  }
};

// Helper functions
const paginate = (data: any[], page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedData = data.slice(offset, offset + limit);
  const total = data.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message,
});

const errorResponse = (error: string, message?: string) => ({
  success: false,
  error,
  message,
});

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'DailySync API Server is running (simplified mode)',
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);

  if (user && (password === 'admin123456' || password === 'agent123456')) {
    res.json(successResponse({
      user,
      token: `mock_token_${user.id}_${Date.now()}`
    }, 'Login successful'));
  } else {
    res.status(401).json(errorResponse('Invalid credentials', 'Login failed'));
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, password, role = 'SUPPORT_AGENT' } = req.body;
  const newUser = {
    id: generateId(),
    email,
    name,
    role,
    isActive: true,
    createdAt: generateDate(0)
  };
  mockUsers.push(newUser);
  res.json(successResponse(newUser, 'User registered successfully'));
});

app.get('/api/auth/me', (req, res) => {
  res.json(successResponse(mockUsers[1])); // Return John Doe as default
});

app.post('/api/auth/logout', (req, res) => {
  res.json(successResponse(null, 'Logged out successfully'));
});

app.post('/api/auth/refresh', (req, res) => {
  const user = mockUsers[1];
  res.json(successResponse({
    user,
    token: `mock_token_${user.id}_${Date.now()}`
  }, 'Token refreshed'));
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'DailySync API is healthy',
    database: 'Not connected (demo mode)',
    redis: 'Not connected (demo mode)',
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalReports: 156,
      totalMeetings: 42,
      totalWebhooks: 8,
      totalUsers: 12,
      recentActivity: [
        { id: 1, type: 'report', message: 'Daily report submitted', timestamp: new Date().toISOString() },
        { id: 2, type: 'meeting', message: 'Team meeting completed', timestamp: new Date().toISOString() },
        { id: 3, type: 'webhook', message: 'Webhook configured', timestamp: new Date().toISOString() },
      ],
      chartData: {
        reports: [
          { date: '2025-06-15', count: 12 },
          { date: '2025-06-16', count: 15 },
          { date: '2025-06-17', count: 18 },
          { date: '2025-06-18', count: 14 },
          { date: '2025-06-19', count: 16 },
        ],
        meetings: [
          { date: '2025-06-15', count: 3 },
          { date: '2025-06-16', count: 5 },
          { date: '2025-06-17', count: 4 },
          { date: '2025-06-18', count: 6 },
          { date: '2025-06-19', count: 4 },
        ]
      }
    }
  });
});

app.get('/api/analytics/daily-reports', (req, res) => {
  const { startDate, endDate, userId } = req.query;
  res.json(successResponse({
    reportCount: 45,
    averageTicketsResolved: 8.5,
    averageChatsHandled: 14.2,
    trends: {
      ticketsResolved: '+12%',
      chatsHandled: '+8%',
      githubIssues: '-5%'
    },
    chartData: [
      { date: '2025-06-15', tickets: 8, chats: 12, emails: 20 },
      { date: '2025-06-16', tickets: 10, chats: 15, emails: 25 },
      { date: '2025-06-17', tickets: 7, chats: 11, emails: 18 },
      { date: '2025-06-18', tickets: 9, chats: 16, emails: 22 },
      { date: '2025-06-19', tickets: 11, chats: 18, emails: 28 },
    ]
  }));
});

app.get('/api/analytics/user-performance', (req, res) => {
  const { startDate, endDate } = req.query;
  const metrics = [
    {
      userId: '2',
      userName: 'John Doe',
      userEmail: 'john.doe@dailysync.com',
      totalReports: 15,
      totalTickets: 245,
      totalChats: 189,
      totalEmails: 312,
      totalCalls: 67,
      totalGithubIssues: 23,
      averageTickets: 8.5,
      averageChats: 14.2,
      averageEmails: 21.7,
      averageCalls: 4.8,
      reportingRate: 87.5
    },
    {
      userId: '3',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@dailysync.com',
      totalReports: 12,
      totalTickets: 198,
      totalChats: 156,
      totalEmails: 267,
      totalCalls: 45,
      totalGithubIssues: 18,
      averageTickets: 7.8,
      averageChats: 13.1,
      averageEmails: 19.2,
      averageCalls: 3.9,
      reportingRate: 75.0
    },
    {
      userId: '4',
      userName: 'Mike Wilson',
      userEmail: 'mike.wilson@dailysync.com',
      totalReports: 8,
      totalTickets: 134,
      totalChats: 98,
      totalEmails: 178,
      totalCalls: 29,
      totalGithubIssues: 12,
      averageTickets: 6.2,
      averageChats: 11.5,
      averageEmails: 16.8,
      averageCalls: 3.2,
      reportingRate: 62.5
    },
    {
      userId: '1',
      userName: 'Admin User',
      userEmail: 'admin@dailysync.com',
      totalReports: 5,
      totalTickets: 89,
      totalChats: 67,
      totalEmails: 123,
      totalCalls: 18,
      totalGithubIssues: 8,
      averageTickets: 4.5,
      averageChats: 8.9,
      averageEmails: 12.3,
      averageCalls: 2.1,
      reportingRate: 45.0
    }
  ];

  res.json(successResponse({
    metrics,
    summary: {
      totalUsers: metrics.length,
      totalReports: metrics.reduce((sum, user) => sum + user.totalReports, 0),
      totalTickets: metrics.reduce((sum, user) => sum + user.totalTickets, 0),
      totalChats: metrics.reduce((sum, user) => sum + user.totalChats, 0),
      averageReportingRate: Math.round(metrics.reduce((sum, user) => sum + user.reportingRate, 0) / metrics.length)
    },
    period: {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      days: 30
    }
  }));
});

app.get('/api/analytics/webhook-analytics', (req, res) => {
  const { startDate, endDate } = req.query;
  res.json(successResponse({
    totalWebhooks: mockWebhooks.length,
    activeWebhooks: mockWebhooks.filter(w => w.status === 'ACTIVE').length,
    totalDeliveries: 1250,
    successfulDeliveries: 1180,
    failedDeliveries: 70,
    successRate: 94.4,
    averageResponseTime: 245,
    deliveryStats: {
      today: 45,
      yesterday: 52,
      thisWeek: 320,
      thisMonth: 1250
    },
    responseTimeChart: [
      { date: '2025-06-15', avgTime: 230 },
      { date: '2025-06-16', avgTime: 245 },
      { date: '2025-06-17', avgTime: 220 },
      { date: '2025-06-18', avgTime: 260 },
      { date: '2025-06-19', avgTime: 245 },
    ]
  }));
});

app.get('/api/analytics/export', (req, res) => {
  const { format = 'json', startDate, endDate, userId } = req.query;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dailysync-export.csv"');

    // Enhanced CSV export with user filtering
    let csvData = 'Date,User,Tickets,Chats,Emails,Calls,GitHub Issues,Meeting Outcome\n';

    let filteredReports = mockDailyReports;
    if (userId) {
      filteredReports = filteredReports.filter(r => r.userId === userId);
    }

    filteredReports.forEach(report => {
      const user = mockUsers.find(u => u.id === report.userId);
      csvData += `${report.date},${user?.name || 'Unknown'},${report.ticketsResolved},${report.chatsHandled},${report.emailsProcessed},${report.callsAttended},${report.githubIssues},\n`;
    });

    mockMeetingReports.forEach(meeting => {
      const user = mockUsers.find(u => u.id === meeting.userId);
      csvData += `${meeting.startTime.split('T')[0]},${user?.name || 'Unknown'},,,,,${meeting.outcome}\n`;
    });

    res.send(csvData);
  } else {
    res.json(successResponse({
      exportedAt: generateDate(0),
      format,
      dateRange: { startDate, endDate },
      data: {
        reports: mockDailyReports,
        meetings: mockMeetingReports,
        webhooks: mockWebhooks
      }
    }));
  }
});

// New Leaderboard endpoint
app.get('/api/analytics/leaderboard', (req, res) => {
  const { metric = 'tickets', startDate, endDate, limit = 10 } = req.query;

  // Calculate leaderboard based on different metrics
  const userStats = mockUsers.map(user => {
    const userReports = mockDailyReports.filter(r => r.userId === user.id);
    const userMeetings = mockMeetingReports.filter(m => m.userId === user.id);

    const totalTickets = userReports.reduce((sum, r) => sum + r.ticketsResolved, 0);
    const totalChats = userReports.reduce((sum, r) => sum + r.chatsHandled, 0);
    const totalEmails = userReports.reduce((sum, r) => sum + r.emailsProcessed, 0);
    const totalCalls = userReports.reduce((sum, r) => sum + r.callsAttended, 0);
    const totalGithubIssues = userReports.reduce((sum, r) => sum + r.githubIssues, 0);
    const totalMeetings = userMeetings.length;
    const successfulMeetings = userMeetings.filter(m => m.outcome === 'SUCCESSFUL').length;

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      totalTickets,
      totalChats,
      totalEmails,
      totalCalls,
      totalGithubIssues,
      totalMeetings,
      successfulMeetings,
      meetingSuccessRate: totalMeetings > 0 ? Math.round((successfulMeetings / totalMeetings) * 100) : 0,
      totalReports: userReports.length,
      averageTicketsPerReport: userReports.length > 0 ? Math.round(totalTickets / userReports.length * 10) / 10 : 0
    };
  });

  // Sort based on requested metric
  let sortedStats;
  switch (metric) {
    case 'chats':
      sortedStats = userStats.sort((a, b) => b.totalChats - a.totalChats);
      break;
    case 'meetings':
      sortedStats = userStats.sort((a, b) => b.totalMeetings - a.totalMeetings);
      break;
    case 'reports':
      sortedStats = userStats.sort((a, b) => b.totalReports - a.totalReports);
      break;
    case 'success_rate':
      sortedStats = userStats.sort((a, b) => b.meetingSuccessRate - a.meetingSuccessRate);
      break;
    default: // tickets
      sortedStats = userStats.sort((a, b) => b.totalTickets - a.totalTickets);
  }

  res.json(successResponse({
    leaderboard: sortedStats.slice(0, Number(limit)),
    metric,
    period: {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0]
    },
    availableMetrics: ['tickets', 'chats', 'meetings', 'reports', 'success_rate']
  }));
});

// User endpoints
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, role, isActive } = req.query;
  let filteredUsers = mockUsers;

  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  if (isActive !== undefined) {
    filteredUsers = filteredUsers.filter(u => u.isActive === (isActive === 'true'));
  }

  const result = paginate(filteredUsers, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/users/me', (req, res) => {
  res.json(successResponse(mockUsers[1])); // Return John Doe as default
});

app.get('/api/users/:id', (req, res) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (user) {
    res.json(successResponse(user));
  } else {
    res.status(404).json(errorResponse('User not found'));
  }
});

app.post('/api/users', (req, res) => {
  const { email, name, role = 'SUPPORT_AGENT' } = req.body;
  const newUser = {
    id: generateId(),
    email,
    name,
    role,
    isActive: true,
    createdAt: generateDate(0)
  };
  mockUsers.push(newUser);
  res.json(successResponse(newUser, 'User created successfully'));
});

app.put('/api/users/:id', (req, res) => {
  const userIndex = mockUsers.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...req.body };
    res.json(successResponse(mockUsers[userIndex], 'User updated successfully'));
  } else {
    res.status(404).json(errorResponse('User not found'));
  }
});

app.delete('/api/users/:id', (req, res) => {
  const userIndex = mockUsers.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    mockUsers[userIndex].isActive = false; // Soft delete
    res.json(successResponse(null, 'User deactivated successfully'));
  } else {
    res.status(404).json(errorResponse('User not found'));
  }
});

app.get('/api/users/:id/reports/daily', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userReports = mockDailyReports.filter(r => r.userId === req.params.id);
  const result = paginate(userReports, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/users/:id/reports/meeting', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userReports = mockMeetingReports.filter(r => r.userId === req.params.id);
  const result = paginate(userReports, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/users/:id/stats', (req, res) => {
  const { days = 30 } = req.query;
  res.json(successResponse({
    totalDailyReports: mockDailyReports.filter(r => r.userId === req.params.id).length,
    totalMeetingReports: mockMeetingReports.filter(r => r.userId === req.params.id).length,
    averageTicketsResolved: 8.5,
    averageChatsHandled: 14.2,
    lastActivity: generateDate(0)
  }));
});

// Daily Reports endpoints
app.get('/api/reports/daily', (req, res) => {
  const { page = 1, limit = 10, userId, startDate, endDate } = req.query;
  let filteredReports = mockDailyReports;

  if (userId) {
    filteredReports = filteredReports.filter(r => r.userId === userId);
  }
  if (startDate) {
    filteredReports = filteredReports.filter(r => r.date >= startDate);
  }
  if (endDate) {
    filteredReports = filteredReports.filter(r => r.date <= endDate);
  }

  const result = paginate(filteredReports, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/reports/daily/:id', (req, res) => {
  const report = mockDailyReports.find(r => r.id === req.params.id);
  if (report) {
    res.json(successResponse(report));
  } else {
    res.status(404).json(errorResponse('Daily report not found'));
  }
});

app.get('/api/reports/daily/date/:date', (req, res) => {
  const report = mockDailyReports.find(r => r.date === req.params.date);
  if (report) {
    res.json(successResponse(report));
  } else {
    res.status(404).json(errorResponse('Daily report not found for this date'));
  }
});

app.post('/api/reports/daily', async (req, res) => {
  const user = mockUsers.find(u => u.id === '2') || mockUsers[1]; // Default to John Doe
  const newReport = {
    id: generateId(),
    date: req.body.date || generateDate(0).split('T')[0],
    ticketsResolved: req.body.ticketsResolved || 0,
    chatsHandled: req.body.chatsHandled || 0,
    githubIssues: req.body.githubIssues || 0,
    emailsProcessed: req.body.emailsProcessed || 0,
    callsAttended: req.body.callsAttended || 0,
    notes: req.body.notes || '',
    links: req.body.links || [],
    userId: '2', // Default to John Doe
    createdAt: generateDate(0)
  };
  mockDailyReports.push(newReport);

  // Trigger outbound webhooks if user preferences allow
  if (user.preferences?.sendDailyReportToSlack) {
    const activeEndpoints = mockEndpoints.filter(e => e.isActive && e.type === 'SLACK');
    const webhookPayload = {
      type: 'daily_report',
      userName: user.name,
      userEmail: user.email,
      date: newReport.date,
      ticketsResolved: newReport.ticketsResolved,
      chatsHandled: newReport.chatsHandled,
      githubIssues: newReport.githubIssues,
      emailsProcessed: newReport.emailsProcessed,
      callsAttended: newReport.callsAttended,
      notes: newReport.notes
    };

    // Simulate webhook deliveries
    for (const endpoint of activeEndpoints) {
      try {
        await deliverToEndpoint(endpoint, webhookPayload);
        console.log(`Daily report webhook delivered to ${endpoint.name}`);
      } catch (error) {
        console.error(`Failed to deliver daily report webhook to ${endpoint.name}:`, error);
      }
    }
  }

  res.json(successResponse(newReport, 'Daily report created successfully'));
});

app.put('/api/reports/daily/:id', (req, res) => {
  const reportIndex = mockDailyReports.findIndex(r => r.id === req.params.id);
  if (reportIndex !== -1) {
    mockDailyReports[reportIndex] = { ...mockDailyReports[reportIndex], ...req.body };
    res.json(successResponse(mockDailyReports[reportIndex], 'Daily report updated successfully'));
  } else {
    res.status(404).json(errorResponse('Daily report not found'));
  }
});

app.delete('/api/reports/daily/:id', (req, res) => {
  const reportIndex = mockDailyReports.findIndex(r => r.id === req.params.id);
  if (reportIndex !== -1) {
    mockDailyReports.splice(reportIndex, 1);
    res.json(successResponse(null, 'Daily report deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Daily report not found'));
  }
});

app.get('/api/reports/daily/stats/summary', (req, res) => {
  const { days = 30 } = req.query;
  const totalReports = mockDailyReports.length;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  res.json(successResponse({
    totalReports,
    averageTicketsResolved: 8.7,
    averageChatsHandled: 14.3,
    averageGithubIssues: 2.1,
    averageEmailsProcessed: 21.7,
    averageCallsAttended: 5.2,
    period: {
      days: Number(days),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    },
    trends: {
      ticketsResolved: '+12%',
      chatsHandled: '+8%',
      githubIssues: '-5%',
      emailsProcessed: '+15%',
      callsAttended: '+3%'
    },
    chartData: [
      { date: '2025-06-15', tickets: 8, chats: 12, emails: 20, calls: 4, github: 2 },
      { date: '2025-06-16', tickets: 10, chats: 15, emails: 25, calls: 6, github: 3 },
      { date: '2025-06-17', tickets: 7, chats: 11, emails: 18, calls: 3, github: 1 },
      { date: '2025-06-18', tickets: 9, chats: 16, emails: 22, calls: 5, github: 2 },
      { date: '2025-06-19', tickets: 11, chats: 18, emails: 28, calls: 7, github: 4 },
    ]
  }));
});

app.post('/api/reports/daily/bulk', (req, res) => {
  const { reports } = req.body;
  const newReports = reports.map((report: any) => ({
    id: generateId(),
    ...report,
    userId: '2',
    createdAt: generateDate(0)
  }));
  mockDailyReports.push(...newReports);
  res.json(successResponse(newReports, 'Bulk daily reports created successfully'));
});

// Meeting Reports endpoints
app.get('/api/reports/meeting', (req, res) => {
  const { page = 1, limit = 10, userId, startDate, endDate, outcome } = req.query;
  let filteredReports = mockMeetingReports;

  if (userId) {
    filteredReports = filteredReports.filter(r => r.userId === userId);
  }
  if (startDate) {
    filteredReports = filteredReports.filter(r => r.startTime >= startDate);
  }
  if (endDate) {
    filteredReports = filteredReports.filter(r => r.startTime <= endDate);
  }
  if (outcome) {
    filteredReports = filteredReports.filter(r => r.outcome === outcome);
  }

  const result = paginate(filteredReports, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/reports/meeting/:id', (req, res) => {
  const report = mockMeetingReports.find(r => r.id === req.params.id);
  if (report) {
    res.json(successResponse(report));
  } else {
    res.status(404).json(errorResponse('Meeting report not found'));
  }
});

app.post('/api/reports/meeting', async (req, res) => {
  const user = mockUsers.find(u => u.id === '2') || mockUsers[1]; // Default to John Doe
  const newReport = {
    id: generateId(),
    title: req.body.title,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    outcome: req.body.outcome,
    notes: req.body.notes || '',
    attendees: req.body.attendees || [],
    actionItems: req.body.actionItems || [],
    userId: '2', // Default to John Doe
    createdAt: generateDate(0)
  };
  mockMeetingReports.push(newReport);

  // Trigger outbound webhooks if user preferences allow
  if (user.preferences?.sendMeetingReportToSlack) {
    const activeEndpoints = mockEndpoints.filter(e => e.isActive && (e.type === 'SLACK' || e.type === 'API'));
    const duration = new Date(newReport.endTime).getTime() - new Date(newReport.startTime).getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    const webhookPayload = {
      type: 'meeting_report',
      userName: user.name,
      userEmail: user.email,
      title: newReport.title,
      startTime: newReport.startTime,
      endTime: newReport.endTime,
      duration: `${durationMinutes} minutes`,
      outcome: newReport.outcome,
      notes: newReport.notes,
      attendees: newReport.attendees,
      actionItems: newReport.actionItems
    };

    // Simulate webhook deliveries
    for (const endpoint of activeEndpoints) {
      try {
        await deliverToEndpoint(endpoint, webhookPayload);
        console.log(`Meeting report webhook delivered to ${endpoint.name}`);
      } catch (error) {
        console.error(`Failed to deliver meeting report webhook to ${endpoint.name}:`, error);
      }
    }
  }

  res.json(successResponse(newReport, 'Meeting report created successfully'));
});

app.put('/api/reports/meeting/:id', (req, res) => {
  const reportIndex = mockMeetingReports.findIndex(r => r.id === req.params.id);
  if (reportIndex !== -1) {
    mockMeetingReports[reportIndex] = { ...mockMeetingReports[reportIndex], ...req.body };
    res.json(successResponse(mockMeetingReports[reportIndex], 'Meeting report updated successfully'));
  } else {
    res.status(404).json(errorResponse('Meeting report not found'));
  }
});

app.delete('/api/reports/meeting/:id', (req, res) => {
  const reportIndex = mockMeetingReports.findIndex(r => r.id === req.params.id);
  if (reportIndex !== -1) {
    mockMeetingReports.splice(reportIndex, 1);
    res.json(successResponse(null, 'Meeting report deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Meeting report not found'));
  }
});

app.get('/api/reports/meeting/stats/summary', (req, res) => {
  const { days = 30 } = req.query;
  const totalMeetings = mockMeetingReports.length;
  const successfulCount = mockMeetingReports.filter(m => m.outcome === 'SUCCESSFUL').length;
  const rescheduledCount = mockMeetingReports.filter(m => m.outcome === 'RESCHEDULED').length;
  const cancelledCount = mockMeetingReports.filter(m => m.outcome === 'CANCELLED').length;

  res.json(successResponse({
    totalMeetings,
    outcomeStats: {
      SUCCESSFUL: successfulCount,
      RESCHEDULED: rescheduledCount,
      CANCELLED: cancelledCount
    },
    totalMinutes: totalMeetings * 45, // Assuming 45 min average
    averageDuration: 45,
    period: `Last ${days} days`,
    successRate: totalMeetings > 0 ? Math.round((successfulCount / totalMeetings) * 100) : 0,
    trends: {
      totalMeetings: '+12%',
      successRate: '+5%',
      averageDuration: '-2%'
    }
  }));
});

// Webhooks endpoints
app.get('/api/webhooks', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = paginate(mockWebhooks, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/webhooks/:id', (req, res) => {
  const webhook = mockWebhooks.find(w => w.id === req.params.id);
  if (webhook) {
    res.json(successResponse(webhook));
  } else {
    res.status(404).json(errorResponse('Webhook not found'));
  }
});

app.post('/api/webhooks', (req, res) => {
  const { name, description, secret, type } = req.body;
  const webhookId = generateId();
  const newWebhook = {
    id: webhookId,
    name,
    description,
    type: type || 'GENERIC',
    url: `/api/webhooks/${webhookId}/receive`,
    secret: secret || `secret_${generateId()}`,
    status: 'ACTIVE',
    createdAt: generateDate(0),
    createdBy: '1'
  };
  mockWebhooks.push(newWebhook);
  res.json(successResponse(newWebhook, 'Webhook created successfully'));
});

app.put('/api/webhooks/:id', (req, res) => {
  const webhookIndex = mockWebhooks.findIndex(w => w.id === req.params.id);
  if (webhookIndex !== -1) {
    mockWebhooks[webhookIndex] = { ...mockWebhooks[webhookIndex], ...req.body };
    res.json(successResponse(mockWebhooks[webhookIndex], 'Webhook updated successfully'));
  } else {
    res.status(404).json(errorResponse('Webhook not found'));
  }
});

app.delete('/api/webhooks/:id', (req, res) => {
  const webhookIndex = mockWebhooks.findIndex(w => w.id === req.params.id);
  if (webhookIndex !== -1) {
    mockWebhooks.splice(webhookIndex, 1);
    res.json(successResponse(null, 'Webhook deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Webhook not found'));
  }
});

// Message templates endpoints
app.get('/api/message-templates', (req, res) => {
  const { type, webhookType } = req.query;
  let templates = mockMessageTemplates;

  if (type) {
    templates = templates.filter(t => t.type === type);
  }

  if (webhookType) {
    templates = templates.filter(t => t.webhookType === webhookType);
  }

  res.json(successResponse(templates));
});

app.get('/api/message-templates/:id', (req, res) => {
  const template = mockMessageTemplates.find(t => t.id === req.params.id);
  if (template) {
    res.json(successResponse(template));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

app.post('/api/message-templates', (req, res) => {
  const { name, template, type, webhookType } = req.body;
  const newTemplate = {
    id: generateId(),
    name,
    template,
    type,
    webhookType,
    createdAt: generateDate(0)
  };
  mockMessageTemplates.push(newTemplate);
  res.json(successResponse(newTemplate, 'Template created successfully'));
});

app.put('/api/message-templates/:id', (req, res) => {
  const templateIndex = mockMessageTemplates.findIndex(t => t.id === req.params.id);
  if (templateIndex !== -1) {
    mockMessageTemplates[templateIndex] = { ...mockMessageTemplates[templateIndex], ...req.body };
    res.json(successResponse(mockMessageTemplates[templateIndex], 'Template updated successfully'));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

app.delete('/api/message-templates/:id', (req, res) => {
  const templateIndex = mockMessageTemplates.findIndex(t => t.id === req.params.id);
  if (templateIndex !== -1) {
    mockMessageTemplates.splice(templateIndex, 1);
    res.json(successResponse(null, 'Template deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

// Webhook test endpoint
app.post('/api/webhooks/:id/test', async (req, res) => {
  const webhook = mockWebhooks.find(w => w.id === req.params.id);
  if (!webhook) {
    return res.status(404).json(errorResponse('Webhook not found'));
  }

  // Generate test payload based on webhook type
  let testPayload;
  if (webhook.type === 'MEETING') {
    testPayload = {
      hostId: '12345',
      meetingTitle: 'Test Meeting - Client Demo',
      startTime: new Date().toISOString(),
      duration: 45,
      clientName: 'Test Client Corp',
      notes: 'This is a test meeting created from webhook test feature',
      attendees: ['test.client@example.com'],
      actionItems: ['Follow up with client', 'Send demo materials']
    };
  } else {
    testPayload = {
      title: 'Test Notification',
      message: 'This is a test payload from the webhook test feature',
      timestamp: new Date().toISOString(),
      user: 'Test User',
      type: 'test'
    };
  }

  // Use custom payload if provided
  if (req.body && Object.keys(req.body).length > 0) {
    testPayload = { ...testPayload, ...req.body };
  }

  try {
    // Simulate the webhook receive process
    const response = await fetch(`http://localhost:3001/api/webhooks/${req.params.id}/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DailySync-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    res.json(successResponse({
      testPayload,
      webhookResponse: result,
      testStatus: response.ok ? 'SUCCESS' : 'FAILED',
      statusCode: response.status,
      timestamp: new Date().toISOString()
    }, 'Webhook test completed'));
  } catch (error) {
    res.json(successResponse({
      testPayload,
      testStatus: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 'Webhook test failed'));
  }
});

app.get('/api/webhooks/:id/logs', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const webhookLogs = mockLogs.filter(log => log.incomingWebhookId === req.params.id);
  const result = paginate(webhookLogs, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/webhooks/:id/stats', (req, res) => {
  res.json(successResponse({
    totalRequests: 156,
    successfulRequests: 142,
    failedRequests: 14,
    averageResponseTime: 245,
    lastRequest: generateDate(0)
  }));
});

// Webhook receive endpoint - processes incoming payloads
app.post('/api/webhooks/:id/receive', async (req, res) => {
  const webhook = mockWebhooks.find(w => w.id === req.params.id);
  if (!webhook) {
    return res.status(404).json(errorResponse('Webhook not found'));
  }

  const payload = req.body;
  const headers = req.headers;
  let meetingCreated = false;
  let createdMeeting = null;

  // Log the incoming payload
  const newLog = {
    id: generateId(),
    payload,
    headers,
    userAgent: headers['user-agent'] || 'Unknown',
    ipAddress: req.ip || '127.0.0.1',
    receivedAt: generateDate(0),
    incomingWebhookId: req.params.id,
    status: 'SUCCESS',
    response: { statusCode: 200, message: 'Payload received and processed' }
  };
  mockLogs.push(newLog);

  // Enhanced meeting auto-creation logic for MEETING type webhooks
  if (webhook.type === 'MEETING' && payload.hostId && payload.meetingTitle) {
    // Find user by external ID (hostId)
    const user = mockUsers.find(u => u.externalUserId === payload.hostId || u.id === payload.hostId);

    if (user) {
      // Calculate meeting end time
      const startTime = payload.startTime ? new Date(payload.startTime) : new Date();
      const duration = payload.duration || 30; // Default 30 minutes
      const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

      // Create new meeting report
      createdMeeting = {
        id: generateId(),
        title: payload.meetingTitle,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        outcome: payload.outcome || 'PENDING',
        notes: payload.notes || `Auto-created from webhook. Client: ${payload.clientName || 'Unknown'}`,
        attendees: payload.attendees || [payload.clientName || 'Unknown Client'],
        actionItems: payload.actionItems || [],
        userId: user.id,
        createdAt: generateDate(0)
      };
      mockMeetingReports.push(createdMeeting);
      meetingCreated = true;

      console.log(`✅ Auto-created meeting "${payload.meetingTitle}" for user ${user.name}`);
    } else {
      console.log(`⚠️ User not found for hostId: ${payload.hostId}`);
    }
  }

  // Get associated outgoing endpoints
  const endpoints = mockEndpoints.filter(e => e.incomingWebhookId === req.params.id && e.isActive);

  // Prepare enhanced payload for templates
  const enhancedPayload = {
    ...payload,
    meetingId: createdMeeting?.id,
    startTimeFormatted: payload.startTime ? new Date(payload.startTime).toLocaleString() : new Date().toLocaleString(),
    timestamp: new Date().toISOString(),
    webhookType: webhook.type
  };

  // Deliver to all endpoints
  const deliveryResults = [];
  for (const endpoint of endpoints) {
    try {
      const result = await deliverToEndpoint(endpoint, enhancedPayload);
      deliveryResults.push({
        endpointId: endpoint.id,
        endpointName: endpoint.name,
        ...result
      });
    } catch (error) {
      deliveryResults.push({
        endpointId: endpoint.id,
        endpointName: endpoint.name,
        success: false,
        error: error.message
      });
    }
  }

  res.json(successResponse({
    received: true,
    processedAt: generateDate(0),
    webhookType: webhook.type,
    meetingCreated,
    createdMeeting,
    deliveryResults,
    totalEndpoints: endpoints.length,
    successfulDeliveries: deliveryResults.filter(r => r.success).length
  }, 'Webhook payload processed successfully'));
});

// Template management endpoints
app.get('/api/templates', (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  let filteredTemplates = mockMessageTemplates;

  if (type) {
    filteredTemplates = filteredTemplates.filter(t => t.type === type);
  }

  const result = paginate(filteredTemplates, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/templates/:id', (req, res) => {
  const template = mockMessageTemplates.find(t => t.id === req.params.id);
  if (template) {
    res.json(successResponse(template));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

app.post('/api/templates', (req, res) => {
  const { name, template, type, description } = req.body;
  const newTemplate = {
    id: generateId(),
    name,
    template,
    type: type || 'SLACK',
    description,
    createdAt: generateDate(0)
  };
  mockMessageTemplates.push(newTemplate);
  res.json(successResponse(newTemplate, 'Template created successfully'));
});

app.put('/api/templates/:id', (req, res) => {
  const templateIndex = mockMessageTemplates.findIndex(t => t.id === req.params.id);
  if (templateIndex !== -1) {
    mockMessageTemplates[templateIndex] = { ...mockMessageTemplates[templateIndex], ...req.body };
    res.json(successResponse(mockMessageTemplates[templateIndex], 'Template updated successfully'));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

app.delete('/api/templates/:id', (req, res) => {
  const templateIndex = mockMessageTemplates.findIndex(t => t.id === req.params.id);
  if (templateIndex !== -1) {
    mockMessageTemplates.splice(templateIndex, 1);
    res.json(successResponse(null, 'Template deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Template not found'));
  }
});

// Logs endpoints
app.get('/api/logs', (req, res) => {
  const { page = 1, limit = 10, webhookId, startDate, endDate } = req.query;
  let filteredLogs = mockLogs;

  if (webhookId) {
    filteredLogs = filteredLogs.filter(l => l.incomingWebhookId === webhookId);
  }
  if (startDate) {
    filteredLogs = filteredLogs.filter(l => l.receivedAt >= startDate);
  }
  if (endDate) {
    filteredLogs = filteredLogs.filter(l => l.receivedAt <= endDate);
  }

  const result = paginate(filteredLogs, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/logs/:id', (req, res) => {
  const log = mockLogs.find(l => l.id === req.params.id);
  if (log) {
    res.json(successResponse(log));
  } else {
    res.status(404).json(errorResponse('Log not found'));
  }
});

app.delete('/api/logs/:id', (req, res) => {
  const logIndex = mockLogs.findIndex(l => l.id === req.params.id);
  if (logIndex !== -1) {
    mockLogs.splice(logIndex, 1);
    res.json(successResponse(null, 'Log deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Log not found'));
  }
});

// Endpoints management
app.get('/api/endpoints', (req, res) => {
  const { page = 1, limit = 10, webhookId } = req.query;
  let filteredEndpoints = mockEndpoints;

  if (webhookId) {
    filteredEndpoints = filteredEndpoints.filter(e => e.incomingWebhookId === webhookId);
  }

  const result = paginate(filteredEndpoints, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.get('/api/endpoints/:id', (req, res) => {
  const endpoint = mockEndpoints.find(e => e.id === req.params.id);
  if (endpoint) {
    res.json(successResponse(endpoint));
  } else {
    res.status(404).json(errorResponse('Endpoint not found'));
  }
});

app.post('/api/endpoints', (req, res) => {
  const newEndpoint = {
    id: generateId(),
    name: req.body.name,
    url: req.body.url,
    method: req.body.method || 'POST',
    headers: req.body.headers || { 'Content-Type': 'application/json' },
    isActive: req.body.isActive !== false,
    retryAttempts: req.body.retryAttempts || 3,
    retryDelayMs: req.body.retryDelayMs || 1000,
    timeoutMs: req.body.timeoutMs || 30000,
    incomingWebhookId: req.body.incomingWebhookId,
    createdAt: generateDate(0)
  };
  mockEndpoints.push(newEndpoint);
  res.json(successResponse(newEndpoint, 'Endpoint created successfully'));
});

app.put('/api/endpoints/:id', (req, res) => {
  const endpointIndex = mockEndpoints.findIndex(e => e.id === req.params.id);
  if (endpointIndex !== -1) {
    mockEndpoints[endpointIndex] = { ...mockEndpoints[endpointIndex], ...req.body };
    res.json(successResponse(mockEndpoints[endpointIndex], 'Endpoint updated successfully'));
  } else {
    res.status(404).json(errorResponse('Endpoint not found'));
  }
});

app.delete('/api/endpoints/:id', (req, res) => {
  const endpointIndex = mockEndpoints.findIndex(e => e.id === req.params.id);
  if (endpointIndex !== -1) {
    mockEndpoints.splice(endpointIndex, 1);
    res.json(successResponse(null, 'Endpoint deleted successfully'));
  } else {
    res.status(404).json(errorResponse('Endpoint not found'));
  }
});

app.post('/api/endpoints/:id/test', (req, res) => {
  const endpoint = mockEndpoints.find(e => e.id === req.params.id);
  if (endpoint) {
    // Simulate endpoint test
    const testResult = {
      success: true,
      statusCode: 200,
      responseTime: Math.floor(Math.random() * 500) + 100,
      response: { message: 'Test payload delivered successfully' },
      timestamp: generateDate(0)
    };
    res.json(successResponse(testResult, 'Endpoint test completed'));
  } else {
    res.status(404).json(errorResponse('Endpoint not found'));
  }
});

app.post('/api/endpoints/:id/template', (req, res) => {
  const { name, template, description } = req.body;
  const endpoint = mockEndpoints.find(e => e.id === req.params.id);
  if (endpoint) {
    const newTemplate = {
      id: generateId(),
      name,
      template,
      description,
      endpointId: req.params.id,
      createdAt: generateDate(0)
    };
    res.json(successResponse(newTemplate, 'Message template created successfully'));
  } else {
    res.status(404).json(errorResponse('Endpoint not found'));
  }
});

app.put('/api/endpoints/:id/template', (req, res) => {
  const { name, template, description } = req.body;
  res.json(successResponse({
    id: generateId(),
    name,
    template,
    description,
    endpointId: req.params.id,
    updatedAt: generateDate(0)
  }, 'Message template updated successfully'));
});

app.delete('/api/endpoints/:id/template', (req, res) => {
  res.json(successResponse(null, 'Message template deleted successfully'));
});

app.get('/api/endpoints/:id/logs', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const endpointLogs = [
    { id: '1', status: 'SUCCESS', statusCode: 200, responseTime: 245, payload: { test: 'data' }, response: { success: true }, timestamp: generateDate(0), endpointId: req.params.id },
    { id: '2', status: 'SUCCESS', statusCode: 200, responseTime: 189, payload: { test: 'data2' }, response: { success: true }, timestamp: generateDate(1), endpointId: req.params.id },
    { id: '3', status: 'FAILED', statusCode: 500, responseTime: 5000, payload: { test: 'data3' }, error: 'Connection timeout', timestamp: generateDate(2), endpointId: req.params.id },
  ];
  const result = paginate(endpointLogs, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

// Activity endpoints
app.get('/api/activity', (req, res) => {
  const { page = 1, limit = 10, type, userId } = req.query;
  const activities = [
    { id: '1', type: 'report', message: 'Daily report submitted', userId: '2', timestamp: generateDate(0) },
    { id: '2', type: 'meeting', message: 'Meeting report created', userId: '2', timestamp: generateDate(1) },
    { id: '3', type: 'webhook', message: 'Webhook configured', userId: '1', timestamp: generateDate(2) },
    { id: '4', type: 'user', message: 'User profile updated', userId: '3', timestamp: generateDate(3) },
  ];

  let filteredActivities = activities;
  if (type) {
    filteredActivities = filteredActivities.filter(a => a.type === type);
  }
  if (userId) {
    filteredActivities = filteredActivities.filter(a => a.userId === userId);
  }

  const result = paginate(filteredActivities, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

// System stats
app.get('/api/stats/system', (req, res) => {
  res.json(successResponse({
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter(u => u.isActive).length,
    totalWebhooks: mockWebhooks.length,
    activeWebhooks: mockWebhooks.filter(w => w.status === 'ACTIVE').length,
    totalDailyReports: mockDailyReports.length,
    totalMeetingReports: mockMeetingReports.length,
    totalLogs: mockLogs.length,
    systemUptime: process.uptime(),
    lastActivity: generateDate(0)
  }));
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(successResponse({
    general: {
      siteName: 'DailySync',
      siteDescription: 'Team Performance Management Platform',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h'
    },
    notifications: {
      emailNotifications: true,
      webhookNotifications: true,
      dailyDigest: true,
      weeklyReport: false
    },
    security: {
      sessionTimeout: 3600,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowedDomains: ['@dailysync.com']
    },
    integrations: {
      slackEnabled: true,
      teamsEnabled: true,
      githubEnabled: false,
      jiraEnabled: false
    }
  }));
});

app.put('/api/settings', (req, res) => {
  // In a real app, this would update the settings in the database
  res.json(successResponse(req.body, 'Settings updated successfully'));
});

app.get('/api/settings/profile', (req, res) => {
  const user = mockUsers[1]; // Default to John Doe
  res.json(successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: null,
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: false,
        desktop: true
      }
    },
    lastLogin: generateDate(0),
    createdAt: user.createdAt
  }));
});

app.put('/api/settings/profile', (req, res) => {
  const { name, email, preferences } = req.body;
  const userIndex = mockUsers.findIndex(u => u.id === '2');
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], name, email };
  }
  res.json(successResponse({
    ...mockUsers[userIndex],
    preferences
  }, 'Profile updated successfully'));
});

app.post('/api/settings/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Mock password validation
  if (currentPassword === 'agent123456') {
    res.json(successResponse(null, 'Password changed successfully'));
  } else {
    res.status(400).json(errorResponse('Current password is incorrect'));
  }
});

// User Preferences endpoints
app.get('/api/settings/preferences', (req, res) => {
  const user = mockUsers[1]; // Default to John Doe
  res.json(successResponse(user.preferences));
});

app.post('/api/settings/preferences', (req, res) => {
  const { preferences } = req.body;
  const userIndex = mockUsers.findIndex(u => u.id === '2');

  if (userIndex !== -1) {
    mockUsers[userIndex].preferences = { ...mockUsers[userIndex].preferences, ...preferences };
    res.json(successResponse(mockUsers[userIndex].preferences, 'Preferences updated successfully'));
  } else {
    res.status(404).json(errorResponse('User not found'));
  }
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
  const { page = 1, limit = 10, unreadOnly } = req.query;
  const notifications = [
    { id: '1', title: 'Daily report reminder', message: 'Don\'t forget to submit your daily report', type: 'reminder', read: false, createdAt: generateDate(0) },
    { id: '2', title: 'Meeting scheduled', message: 'Team standup meeting in 30 minutes', type: 'meeting', read: false, createdAt: generateDate(0) },
    { id: '3', title: 'Webhook delivery failed', message: 'Slack webhook delivery failed - check configuration', type: 'error', read: true, createdAt: generateDate(1) },
    { id: '4', title: 'Weekly report ready', message: 'Your weekly performance report is available', type: 'report', read: true, createdAt: generateDate(2) },
  ];

  let filteredNotifications = notifications;
  if (unreadOnly === 'true') {
    filteredNotifications = notifications.filter(n => !n.read);
  }

  const result = paginate(filteredNotifications, Number(page), Number(limit));
  res.json({ success: true, ...result });
});

app.put('/api/notifications/:id/read', (req, res) => {
  res.json(successResponse(null, 'Notification marked as read'));
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  res.json(successResponse(null, 'All notifications marked as read'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 DailySync API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`⚠️ Running in simplified mode (no database)`);
});

export default app;
