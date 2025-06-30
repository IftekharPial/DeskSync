# 🚀 DailySync Application Startup Guide

## Prerequisites Check

Before starting, ensure you have the following installed and running:

### 1. **Node.js 18+**
```bash
node --version
# Should show v18.x.x or higher
```

### 2. **Package Manager (pnpm recommended)**
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Verify installation
pnpm --version
```

### 3. **PostgreSQL 15+**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running, start PostgreSQL service:
# Windows: Start PostgreSQL service from Services
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### 4. **Redis 7+**
```bash
# Check if Redis is running
redis-cli ping
# Should return "PONG"

# If not running, start Redis:
# Windows: Start Redis service or run redis-server
# Mac: brew services start redis
# Linux: sudo systemctl start redis
```

## Step-by-Step Startup Process

### Step 1: Install Dependencies
```bash
# Navigate to project directory
cd dailysync

# Install all dependencies
pnpm install
```

### Step 2: Environment Configuration
The `.env` file has been created with default development settings. Update the following if needed:

```env
# Update PostgreSQL credentials if different
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/dailysync"

# Update Redis URL if different
REDIS_URL="redis://localhost:6379"
```

### Step 3: Database Setup
```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed
```

### Step 4: Start All Services
```bash
# Start all services (API, Web, Worker)
pnpm dev
```

This will start:
- **API Server**: http://localhost:3001
- **Web Application**: http://localhost:3000
- **Background Worker**: Queue processing

### Step 5: Verify Services

#### Check API Health
Open: http://localhost:3001/api/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

#### Check Web Application
Open: http://localhost:3000

You should see the DailySync login page.

## Default Login Credentials

After seeding the database, you can use these test accounts:

### Regular User
- **Email**: `user@example.com`
- **Password**: `password123`

### Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`

## Troubleshooting

### Common Issues and Solutions

#### 1. **Database Connection Error**
```
Error: Can't reach database server at localhost:5432
```
**Solution:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Create database if it doesn't exist:
  ```sql
  CREATE DATABASE dailysync;
  ```

#### 2. **Redis Connection Error**
```
Error: Redis connection failed
```
**Solution:**
- Start Redis service
- Check Redis URL in `.env`
- Test connection: `redis-cli ping`

#### 3. **Port Already in Use**
```
Error: Port 3000 is already in use
```
**Solution:**
- Kill process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:3000 | xargs kill -9
  ```

#### 4. **Prisma Client Not Generated**
```
Error: Prisma Client is not generated
```
**Solution:**
```bash
pnpm db:generate
```

#### 5. **Migration Errors**
```
Error: Migration failed
```
**Solution:**
```bash
# Reset database (WARNING: This will delete all data)
pnpm db:reset

# Or manually run migrations
pnpm db:migrate
```

## Service URLs and Endpoints

### Web Application
- **Main App**: http://localhost:3000
- **Login**: http://localhost:3000/auth/signin
- **Dashboard**: http://localhost:3000/dashboard

### API Endpoints
- **Health Check**: http://localhost:3001/api/health
- **API Documentation**: http://localhost:3001/api/docs (if available)
- **Authentication**: http://localhost:3001/api/auth
- **Daily Reports**: http://localhost:3001/api/daily-reports
- **Meeting Reports**: http://localhost:3001/api/meeting-reports
- **Webhooks**: http://localhost:3001/api/webhooks
- **Analytics**: http://localhost:3001/api/analytics

## Testing Preparation

### 1. **Open Testing Checklist**
Open `testing-checklist.html` in your browser for interactive testing.

### 2. **Run API Tests**
```bash
node scripts/test-api.js
```

### 3. **Load Testing**
```bash
# Install artillery if not already installed
npm install -g artillery

# Run load tests
artillery run scripts/load-test.yml
```

## Development Commands

```bash
# Start all services
pnpm dev

# Start individual services
pnpm dev:api      # API server only
pnpm dev:web      # Web app only
pnpm dev:worker   # Worker only

# Database commands
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data
pnpm db:reset     # Reset database
pnpm db:studio    # Open Prisma Studio

# Testing
pnpm test         # Run all tests
pnpm test:unit    # Unit tests only
pnpm test:e2e     # E2E tests only

# Build
pnpm build        # Build all apps
pnpm build:api    # Build API only
pnpm build:web    # Build web app only

# Linting
pnpm lint         # Lint all code
pnpm lint:fix     # Fix linting issues
```

## Next Steps

1. **Start the application** using the commands above
2. **Verify all services** are running correctly
3. **Login** using the default credentials
4. **Explore the features**:
   - Create daily reports
   - Manage meeting reports
   - View analytics (admin)
   - Configure webhooks (admin)
   - Monitor system health
5. **Run comprehensive testing** using the testing checklist

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Check the browser console for frontend errors
4. Verify all prerequisites are installed and running
5. Refer to the comprehensive testing guide in `TESTING_GUIDE.md`

---

**Ready to start testing!** 🎉

Once all services are running, you can begin comprehensive functional testing of all DailySync features.
