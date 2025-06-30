# API Reference

This document provides comprehensive documentation for the DailySync API endpoints.

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.dailysync.com/api
```

## Authentication

All API endpoints require authentication using JWT tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER"
    }
  }
}
```

## Daily Reports

### Create Daily Report

```http
POST /api/daily-reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-01-15",
  "ticketsResolved": 5,
  "chatsHandled": 10,
  "githubIssues": 2,
  "emailsProcessed": 15,
  "callsAttended": 3,
  "notes": "Productive day with good progress on tickets",
  "links": ["https://github.com/org/repo/issues/123"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-id",
    "userId": "user-id",
    "date": "2024-01-15T00:00:00.000Z",
    "ticketsResolved": 5,
    "chatsHandled": 10,
    "githubIssues": 2,
    "emailsProcessed": 15,
    "callsAttended": 3,
    "notes": "Productive day with good progress on tickets",
    "links": ["https://github.com/org/repo/issues/123"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Daily Reports

```http
GET /api/daily-reports?page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "report-id",
        "userId": "user-id",
        "date": "2024-01-15T00:00:00.000Z",
        "ticketsResolved": 5,
        "chatsHandled": 10,
        "githubIssues": 2,
        "emailsProcessed": 15,
        "callsAttended": 3,
        "notes": "Productive day",
        "links": [],
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Daily Report by ID

```http
GET /api/daily-reports/{id}
Authorization: Bearer <token>
```

### Update Daily Report

```http
PUT /api/daily-reports/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "ticketsResolved": 8,
  "notes": "Updated notes"
}
```

### Delete Daily Report

```http
DELETE /api/daily-reports/{id}
Authorization: Bearer <token>
```

### Get Daily Report Statistics

```http
GET /api/daily-reports/stats?days=30
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)
- `startDate` (optional): Custom start date (YYYY-MM-DD)
- `endDate` (optional): Custom end date (YYYY-MM-DD)

## Meeting Reports

### Create Meeting Report

```http
POST /api/meeting-reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Weekly Team Standup",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T10:30:00.000Z",
  "outcome": "SUCCESSFUL",
  "notes": "Discussed sprint progress and blockers",
  "attendees": ["john@example.com", "jane@example.com"],
  "actionItems": ["Update documentation", "Fix bug #123"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting-id",
    "userId": "user-id",
    "title": "Weekly Team Standup",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z",
    "outcome": "SUCCESSFUL",
    "notes": "Discussed sprint progress and blockers",
    "attendees": ["john@example.com", "jane@example.com"],
    "actionItems": ["Update documentation", "Fix bug #123"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Meeting Reports

```http
GET /api/meeting-reports?page=1&limit=10
Authorization: Bearer <token>
```

## Webhooks (Admin Only)

### Create Webhook

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Slack Integration",
  "description": "Send daily reports to Slack",
  "secret": "webhook-secret-key",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook-id",
    "name": "Slack Integration",
    "description": "Send daily reports to Slack",
    "url": "https://api.dailysync.com/webhook/abc123",
    "secret": "webhook-secret-key",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Create Outgoing Endpoint

```http
POST /api/webhooks/{webhookId}/endpoints
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "url": "https://hooks.slack.com/services/...",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "template": "{\"text\": \"New daily report: {{ticketsResolved}} tickets resolved\"}",
  "isActive": true
}
```

### Get Webhook Logs

```http
GET /api/webhooks/{webhookId}/logs?page=1&limit=10
Authorization: Bearer <admin-token>
```

## Analytics (Admin Only)

### Get User Performance

```http
GET /api/analytics/user-performance?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin-token>
```

### Get Webhook Analytics

```http
GET /api/analytics/webhooks
Authorization: Bearer <admin-token>
```

### Export Data

```http
POST /api/analytics/export
Content-Type: application/json
Authorization: Bearer <token>

{
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "Specific field error"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- General API: 100 requests per minute per IP
- Webhook endpoints: 1000 requests per minute per IP
- Authentication: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Webhooks

### Webhook Payload Format

When creating webhooks, payloads are sent in this format:

```json
{
  "type": "daily_report_created",
  "data": {
    "userId": "user-id",
    "reportId": "report-id",
    "date": "2024-01-15",
    "ticketsResolved": 5,
    "chatsHandled": 10,
    "githubIssues": 2,
    "emailsProcessed": 15,
    "callsAttended": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Webhook Security

Webhooks include a signature header for verification:
```
X-Webhook-Signature: sha256=<signature>
```

Verify the signature using your webhook secret:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```
