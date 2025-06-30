# DailySync Comprehensive Testing Guide

## Prerequisites Setup

### 1. Install Required Software
```bash
# Install Node.js 18+ from https://nodejs.org/
node --version  # Should be 18+

# Install pnpm globally
npm install -g pnpm

# Install PostgreSQL 15+ from https://postgresql.org/
# Install Redis 7+ from https://redis.io/
```

### 2. Environment Setup
```bash
# Clone and navigate to project
cd dailysync

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `.env` file with your local settings:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dailysync_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-for-development"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API Configuration
API_PORT=3001
WEBHOOK_API_KEY="dev-webhook-api-key"

# Development
NODE_ENV="development"
```

### 4. Database Setup
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

### 5. Start Services
```bash
# Start all services (API, Web, Worker)
pnpm dev

# Or start individually in separate terminals:
pnpm dev:api     # API server on http://localhost:3001
pnpm dev:web     # Web app on http://localhost:3000
pnpm dev:worker  # Background worker
```

## Testing Checklist

### ✅ 1. Environment Verification
- [ ] PostgreSQL is running and accessible
- [ ] Redis is running and accessible
- [ ] All dependencies installed successfully
- [ ] Database migrations completed
- [ ] Seed data loaded
- [ ] API server started on port 3001
- [ ] Web app started on port 3000
- [ ] Worker process running

### ✅ 2. Authentication System Testing

#### Registration & Login
- [ ] Navigate to http://localhost:3000
- [ ] Test user registration (if available)
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Verify JWT token in browser storage
- [ ] Test automatic redirect after login

#### Role-Based Access Control
- [ ] Login as regular USER
- [ ] Verify access to user features only
- [ ] Login as ADMIN user
- [ ] Verify access to admin features
- [ ] Test unauthorized access attempts

#### Session Management
- [ ] Test session persistence across browser refresh
- [ ] Test logout functionality
- [ ] Verify token expiration handling

### ✅ 3. Daily Reports Functionality

#### Create Daily Reports
- [ ] Navigate to Daily Reports section
- [ ] Click "New Daily Report"
- [ ] Fill all required fields:
  - [ ] Date selection
  - [ ] Tickets Resolved (number)
  - [ ] Chats Handled (number)
  - [ ] GitHub Issues (number)
  - [ ] Emails Processed (number)
  - [ ] Calls Attended (number)
  - [ ] Notes (optional text)
  - [ ] Links (optional URLs)
- [ ] Submit report successfully
- [ ] Verify report appears in list

#### Validation Testing
- [ ] Try submitting empty form
- [ ] Test negative numbers
- [ ] Test invalid date formats
- [ ] Test duplicate date submission
- [ ] Test invalid URL formats in links
- [ ] Verify error messages display correctly

#### Report Management
- [ ] View list of all reports
- [ ] Test pagination (if more than 10 reports)
- [ ] Filter reports by date range
- [ ] Edit existing report
- [ ] Delete report with confirmation
- [ ] Search reports by content

### ✅ 4. Meeting Reports System

#### Create Meeting Reports
- [ ] Navigate to Meeting Reports section
- [ ] Click "New Meeting Report"
- [ ] Fill meeting details:
  - [ ] Meeting title
  - [ ] Start time
  - [ ] End time (optional)
  - [ ] Outcome selection (Successful/Cancelled/Rescheduled/Pending)
  - [ ] Attendees list
  - [ ] Action items
  - [ ] Meeting notes
- [ ] Submit meeting report
- [ ] Verify report in meetings list

#### Meeting Management
- [ ] View all meeting reports
- [ ] Filter by outcome type
- [ ] Filter by date range
- [ ] Edit meeting details
- [ ] Update meeting outcome
- [ ] Delete meeting report
- [ ] Verify duration calculation

### ✅ 5. Analytics Dashboard

#### Personal Analytics
- [ ] Navigate to Analytics section
- [ ] View personal performance charts
- [ ] Test date range selection
- [ ] Verify chart data accuracy
- [ ] Check responsive chart behavior
- [ ] Test different time periods (7 days, 30 days, custom)

#### Data Export
- [ ] Click Export Data
- [ ] Select date range
- [ ] Export as CSV format
- [ ] Export as JSON format
- [ ] Verify downloaded file content
- [ ] Test large date ranges

#### Admin Analytics (Admin only)
- [ ] Login as admin user
- [ ] View system-wide analytics
- [ ] Check user performance comparisons
- [ ] Verify team statistics
- [ ] Test organization metrics

### ✅ 6. Webhook System (Admin Features)

#### Webhook Configuration
- [ ] Navigate to Admin → Webhooks
- [ ] Create new incoming webhook
- [ ] Configure webhook settings:
  - [ ] Name and description
  - [ ] Secret key
  - [ ] Status (Active/Inactive)
- [ ] Copy webhook URL
- [ ] Verify webhook appears in list

#### Outgoing Endpoints
- [ ] Select webhook from list
- [ ] Add outgoing endpoint
- [ ] Configure endpoint:
  - [ ] Destination URL
  - [ ] HTTP method
  - [ ] Custom headers
  - [ ] Message template
- [ ] Test endpoint configuration
- [ ] Verify endpoint in list

#### Webhook Testing
- [ ] Send test payload to webhook URL
- [ ] Verify payload processing
- [ ] Check delivery logs
- [ ] Test webhook signature verification
- [ ] Test retry mechanism for failed deliveries

### ✅ 7. System Health Monitoring

#### Health Dashboard
- [ ] Navigate to Admin → System Health
- [ ] Verify real-time metrics display
- [ ] Check system status indicators
- [ ] Monitor API response times
- [ ] Check database health
- [ ] Verify Redis connection status

#### Performance Metrics
- [ ] View webhook delivery statistics
- [ ] Check queue processing metrics
- [ ] Monitor error rates
- [ ] Verify alert generation
- [ ] Test auto-refresh functionality

### ✅ 8. API Endpoints Testing

#### Using Browser Network Tab
- [ ] Open browser developer tools
- [ ] Navigate to Network tab
- [ ] Perform various actions in the app
- [ ] Verify API calls and responses
- [ ] Check HTTP status codes
- [ ] Verify response formats

#### Direct API Testing
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test daily reports (with token)
curl -X GET http://localhost:3001/api/daily-reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test webhook creation (admin token)
curl -X POST http://localhost:3001/api/webhooks \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Webhook","status":"ACTIVE"}'
```

### ✅ 9. Queue System Verification

#### Background Jobs
- [ ] Create daily report and verify webhook processing
- [ ] Check queue dashboard (if available)
- [ ] Monitor job completion
- [ ] Test job retry on failure
- [ ] Verify email notification queuing

#### Queue Health
- [ ] Check Redis connection
- [ ] Monitor queue sizes
- [ ] Verify worker process status
- [ ] Test job processing speed

### ✅ 10. Error Handling & Edge Cases

#### Input Validation
- [ ] Submit forms with missing required fields
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts in text fields
- [ ] Submit extremely large payloads
- [ ] Test special characters in inputs

#### Network & System Errors
- [ ] Disconnect internet and test offline behavior
- [ ] Stop database and test error handling
- [ ] Stop Redis and test queue behavior
- [ ] Test rate limiting by making many requests
- [ ] Test concurrent user sessions

#### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Test mobile responsiveness

## Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
artillery quick --count 10 --num 5 http://localhost:3001/api/health

# Test API endpoints under load
artillery run load-test-config.yml
```

### Memory & Resource Monitoring
- [ ] Monitor memory usage during testing
- [ ] Check CPU usage under load
- [ ] Monitor database connections
- [ ] Check Redis memory usage

## Security Testing

### Authentication Security
- [ ] Test JWT token manipulation
- [ ] Test session hijacking attempts
- [ ] Verify CORS configuration
- [ ] Test rate limiting effectiveness

### Input Security
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Verify input sanitization

## Bug Reporting Template

When you find issues, document them using this template:

```
**Bug Title:** Brief description of the issue

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/Mac/Linux]
- Node.js version: [version]
- Database: [PostgreSQL version]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots/Logs:**
Include relevant screenshots or error logs

**Severity:**
- Critical (app crashes/data loss)
- High (major feature broken)
- Medium (minor feature issue)
- Low (cosmetic issue)
```

## Success Criteria

The testing is considered successful when:
- [ ] All core features work as expected
- [ ] No critical or high-severity bugs found
- [ ] Performance meets acceptable standards
- [ ] Security measures are effective
- [ ] User experience is smooth and intuitive
- [ ] Admin features function correctly
- [ ] API endpoints respond correctly
- [ ] Background processing works reliably

## Next Steps After Testing

1. Document all findings
2. Prioritize bug fixes
3. Create improvement recommendations
4. Plan deployment strategy
5. Set up monitoring and alerting
6. Prepare user training materials
