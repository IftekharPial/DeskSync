# DailySync Production Deployment Guide

## 🚀 **Pre-Deployment Checklist**

### **1. Environment Variables Setup**

Create or update your `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dailysync"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Slack Integration (Optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Node Environment
NODE_ENV="production"
```

### **2. Database Migration**

Run the following commands to update your database schema:

```bash
# Navigate to the database package
cd packages/database

# Push schema changes to database
pnpm prisma db push

# Generate Prisma client
pnpm prisma generate

# Seed support platforms (optional)
node prisma/seed-platforms.ts
```

### **3. Build Verification**

Test the build process locally:

```bash
# Install dependencies
pnpm install

# Run type checking
turbo run type-check

# Run linting
turbo run lint

# Build the application
turbo run build

# Test production build locally
turbo run start
```

---

## 🔧 **Vercel Deployment Configuration**

### **Build Settings:**
- **Build Command**: `pnpm vercel-build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`
- **Root Directory**: `./`

### **Environment Variables in Vercel:**
Add these in your Vercel dashboard:

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 📊 **Database Setup**

### **PostgreSQL Requirements:**
- PostgreSQL 15+ recommended
- Connection pooling enabled
- SSL enabled for production

### **Recommended Providers:**
- **Supabase** (Recommended for ease of use)
- **PlanetScale** (MySQL alternative)
- **Railway** (PostgreSQL with good free tier)
- **Neon** (Serverless PostgreSQL)

### **Supabase Setup Example:**
1. Create new project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Add to environment variables as `DATABASE_URL`

---

## 🔐 **Security Configuration**

### **NextAuth Setup:**
1. Generate secure secret: `openssl rand -base64 32`
2. Set `NEXTAUTH_SECRET` environment variable
3. Configure `NEXTAUTH_URL` with your domain

### **Admin User Setup:**
Update the demo credentials in `apps/web/src/lib/auth.ts`:

```typescript
const demoUsers = [
  { 
    id: '1', 
    email: 'your-admin@company.com', 
    password: 'secure-password', 
    name: 'Admin User', 
    role: 'ADMIN' as const 
  },
  // Add more users as needed
]
```

**⚠️ Important:** Replace demo authentication with proper user management in production.

---

## 📱 **Slack Integration Setup**

### **Create Slack Webhook:**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app or use existing
3. Enable Incoming Webhooks
4. Create webhook for desired channel
5. Copy webhook URL to `SLACK_WEBHOOK_URL`

### **Webhook Message Format:**
The system sends notifications for:
- ✅ New meetings created via webhooks
- ✅ Daily reports submitted
- ✅ Platform-specific reporting data

---

## 🧪 **Testing in Production**

### **1. Run Feature Tests:**
```bash
# Update baseUrl in test file to your production URL
node test-webhook-receive.js
```

### **2. Manual Testing Checklist:**
- [ ] User authentication works
- [ ] Admin can access platform management
- [ ] Daily reports can be created with platforms
- [ ] Meeting reports include customer fields
- [ ] Webhook endpoint receives and processes data
- [ ] Slack notifications are sent (if configured)
- [ ] Analytics display platform statistics

### **3. API Endpoint Verification:**
Test these endpoints are working:
- `GET /api/platforms` - Platform listing
- `POST /api/admin/platforms` - Platform creation (admin only)
- `POST /api/webhooks/[id]/receive` - Webhook reception
- `GET /api/analytics/dashboard` - Analytics data
- `POST /api/reports/daily` - Daily report creation

---

## 📈 **Monitoring & Maintenance**

### **Health Checks:**
- Monitor `/api/platforms` endpoint
- Check database connection status
- Verify Slack webhook delivery

### **Performance Monitoring:**
- Database query performance
- API response times
- Webhook processing speed
- User session management

### **Regular Maintenance:**
- Review platform usage statistics
- Clean up old webhook logs
- Monitor user activity
- Update platform list as needed

---

## 🔄 **Backup & Recovery**

### **Database Backups:**
- Enable automated backups in your database provider
- Test restore procedures regularly
- Export platform configuration periodically

### **Configuration Backups:**
- Document environment variables
- Save Slack webhook configurations
- Backup user role assignments

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**Database Connection Errors:**
```bash
# Check connection string format
# Ensure database is accessible
# Verify SSL settings
```

**Webhook Reception Issues:**
```bash
# Check webhook ID exists in database
# Verify payload format matches schema
# Check authentication headers
```

**Platform Management Issues:**
```bash
# Ensure user has ADMIN role
# Check middleware protection
# Verify API route accessibility
```

**Slack Notification Failures:**
```bash
# Verify SLACK_WEBHOOK_URL is correct
# Check webhook permissions in Slack
# Review error logs for details
```

---

## 📞 **Support & Documentation**

### **Additional Resources:**
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)
- [Slack Webhook Guide](https://api.slack.com/messaging/webhooks)

### **Feature Documentation:**
- Platform management: `/dashboard/admin/platforms`
- Enhanced daily reports: `/dashboard/reports`
- Meeting management: `/dashboard/meetings`
- Analytics dashboard: `/dashboard/analytics`

---

## ✅ **Deployment Complete**

After following this guide, your DailySync application will have:
- ✅ Dynamic platform management
- ✅ Enhanced meeting tracking with customer data
- ✅ Webhook-based meeting creation
- ✅ Platform-specific daily reporting
- ✅ Slack notifications
- ✅ Admin management interface
- ✅ Production-ready security
- ✅ Comprehensive monitoring

**🎉 Your DailySync application is ready for production use!**
