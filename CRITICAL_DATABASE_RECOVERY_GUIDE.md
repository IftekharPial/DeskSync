# 🚨 CRITICAL: DailySync Database Recovery Guide

## **IMMEDIATE ACTION REQUIRED**

The DailySync application is experiencing complete system failure due to missing database connectivity. Follow these steps **IMMEDIATELY** to restore functionality.

---

## **🔧 Step 1: Configure Vercel Environment Variables**

### **Add these environment variables in Vercel Dashboard:**

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

```env
DATABASE_URL=postgresql://postgres.uqbqwtikpekoqcxjamid:xoobzyQbneLFvQeu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

SUPABASE_URL=https://uqbqwtikpekoqcxjamid.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxYnF3dGlrcGVrb3FjeGphbWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTEyODEsImV4cCI6MjA2NjE4NzI4MX0.RRsyg56qLlSTDOxC_Gci_Lm4AiTtNDkCoRHuEa0mKBI

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxYnF3dGlrcGVrb3FjeGphbWlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYxMTI4MSwiZXhwIjoyMDY2MTg3MjgxfQ.FxYKURbum5mcjGBcfV13zVzegZFSTf4-X8RDj7mVYNY

NEXTAUTH_URL=https://your-vercel-app-url.vercel.app

NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production-use-openssl-rand-base64-32
```

**⚠️ IMPORTANT:** Replace `your-vercel-app-url.vercel.app` with your actual Vercel deployment URL.

---

## **🏗️ Step 2: Create Database Schema**

### **Option A: Using Supabase SQL Editor (RECOMMENDED)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `uqbqwtikpekoqcxjamid`
3. Navigate to SQL Editor
4. Copy and paste the entire content from `supabase-schema.sql`
5. Click "Run" to execute the schema creation

### **Option B: Using Local Prisma (if Option A fails)**

```bash
# In the project root directory
cd packages/database
npx prisma db push
npx prisma generate
```

---

## **🌱 Step 3: Verify Database Setup**

### **Test Database Connection:**

Run the verification script:
```bash
node setup-database.js
```

Expected output:
```
✅ Database connection successful!
✅ Users table: X records
✅ Support platforms table: X records
✅ Webhooks table: X records
```

---

## **🚀 Step 4: Deploy and Test Application**

### **Trigger Vercel Redeploy:**

1. Push any small change to trigger redeploy:
```bash
git add .
git commit -m "fix: Configure database connection for production"
git push origin main
```

2. Or manually redeploy in Vercel dashboard

### **Test Application Functionality:**

1. **Authentication Test:**
   - Visit your Vercel app URL
   - Try logging in with demo credentials:
     - Email: `john.doe@dailysync.com`
     - Password: `password123`

2. **Core Features Test:**
   - ✅ Dashboard loads without infinite loading
   - ✅ Webhook creation and management works
   - ✅ Meeting reports can be created and viewed
   - ✅ Daily reports functionality works
   - ✅ Platform management interface loads
   - ✅ Analytics dashboard displays data

---

## **📊 Expected Results After Fix**

### **Before Fix (Current State):**
- ❌ Infinite loading on all pages
- ❌ Database connection errors
- ❌ No data displays anywhere
- ❌ CRUD operations fail
- ❌ Authentication issues

### **After Fix (Expected State):**
- ✅ All pages load with actual data
- ✅ Webhook creation saves and displays webhooks
- ✅ Meeting history shows existing reports
- ✅ Daily reports can be created and viewed
- ✅ Platform management shows support platforms
- ✅ Analytics dashboard displays metrics
- ✅ User authentication works properly

---

## **🔍 Troubleshooting**

### **If Database Connection Still Fails:**

1. **Check Environment Variables:**
   ```bash
   # Verify in Vercel dashboard that all env vars are set
   # Ensure no extra spaces or quotes in values
   ```

2. **Check Database URL Format:**
   ```
   # Correct format:
   postgresql://username:password@host:port/database?sslmode=require
   
   # NOT:
   postgres://... (use postgresql://)
   ```

3. **Test Connection Locally:**
   ```bash
   # Set environment variables locally and test
   export DATABASE_URL="postgresql://..."
   node setup-database.js
   ```

### **If Schema Creation Fails:**

1. **Manual Schema Creation:**
   - Use Supabase SQL Editor
   - Run each CREATE statement individually
   - Check for existing tables first

2. **Permission Issues:**
   - Ensure Supabase user has CREATE permissions
   - Check if database is in read-only mode

---

## **🎯 Success Criteria Checklist**

- [ ] All environment variables configured in Vercel
- [ ] Database schema created successfully
- [ ] Demo user and platforms seeded
- [ ] Application redeploys without errors
- [ ] Login works with demo credentials
- [ ] Dashboard loads with data (not infinite loading)
- [ ] Webhook CRUD operations functional
- [ ] Meeting reports can be created/viewed
- [ ] Daily reports functionality works
- [ ] Platform management interface operational
- [ ] Analytics dashboard displays metrics

---

## **📞 Emergency Contacts**

If issues persist:
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Verify network connectivity to Supabase
4. Ensure all environment variables are correctly set

---

## **🔐 Demo Credentials**

After successful setup, use these credentials to test:

**Admin User:**
- Email: `john.doe@dailysync.com`
- Password: `password123`

**Regular User:**
- Email: `jane.smith@dailysync.com`
- Password: `password123`

---

**⏰ PRIORITY: CRITICAL - Complete system restoration required immediately for production deployment.**
