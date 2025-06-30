# 🚀 DailySync Installation Guide for Windows

This comprehensive guide will help you install and run DailySync on your Windows system.

## 📋 Quick Start Options

### Option 1: Automated Setup (Recommended)
```cmd
# Run the complete setup wizard
setup-complete.bat
```

### Option 2: Step-by-Step Setup
```cmd
# 1. Check system requirements
system-check.bat

# 2. Install dependencies
install-dependencies.bat

# 3. Setup database
setup-database.bat

# 4. Start application
start-application.bat
```

### Option 3: Docker Setup (Alternative)
```cmd
# If you prefer Docker or have installation issues
docker-setup.bat
```

## 🔧 System Requirements

### Required Software
1. **Node.js 18+** - JavaScript runtime
2. **PostgreSQL 15+** - Database server
3. **Redis 7+** - Cache and queue system (optional but recommended)

### Optional Software
- **Docker Desktop** - For containerized setup
- **Git** - For version control
- **Visual Studio Code** - For development

## 📥 Manual Installation Steps

### Step 1: Install Node.js

1. **Download Node.js:**
   - Go to https://nodejs.org/
   - Download the **LTS version** (18.x or higher)
   - Choose "Windows Installer (.msi)"

2. **Install Node.js:**
   - Run the downloaded installer
   - **Important:** Check "Add to PATH" during installation
   - Accept all default settings
   - Restart Command Prompt after installation

3. **Verify Installation:**
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15+ installer
   - Choose the Windows x86-64 version

2. **Install PostgreSQL:**
   - Run the installer as Administrator
   - Set a password for the 'postgres' user (remember this!)
   - Use default port 5432
   - Install with default components

3. **Start PostgreSQL Service:**
   - Open Windows Services (services.msc)
   - Find "postgresql-x64-15" service
   - Start the service if not running

4. **Create Database:**
   ```cmd
   # Open Command Prompt and run:
   psql -U postgres
   # Enter your postgres password when prompted
   CREATE DATABASE dailysync;
   \q
   ```

### Step 3: Install Redis (Optional)

#### Option A: Redis for Windows (Recommended)
1. Go to https://github.com/microsoftarchive/redis/releases
2. Download "Redis-x64-3.0.504.msi"
3. Install and start the Redis service

#### Option B: Chocolatey Package Manager
```cmd
# Install Chocolatey first: https://chocolatey.org/install
# Then install Redis:
choco install redis-64
```

#### Option C: Docker Redis
```cmd
# If you have Docker installed:
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Step 4: Setup DailySync Project

1. **Navigate to Project Directory:**
   ```cmd
   cd path\to\dailysync
   ```

2. **Install Dependencies:**
   ```cmd
   npm install
   # or if you have pnpm:
   pnpm install
   ```

3. **Create Environment File:**
   ```cmd
   copy .env.example .env
   # Edit .env file with your database credentials
   ```

4. **Setup Database:**
   ```cmd
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Application:**
   ```cmd
   npm run dev
   ```

## 🌐 Access URLs

After successful setup:
- **Web Application:** http://localhost:3000
- **API Server:** http://localhost:3001
- **API Health Check:** http://localhost:3001/api/health

## 🔑 Default Login Credentials

- **Regular User:** user@example.com / password123
- **Admin User:** admin@example.com / admin123

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Node.js not recognized"
**Problem:** Node.js not in PATH
**Solution:**
- Reinstall Node.js with "Add to PATH" checked
- Restart Command Prompt
- Or manually add Node.js to PATH

#### 2. "PostgreSQL connection failed"
**Problem:** Database not running or wrong credentials
**Solution:**
- Start PostgreSQL service
- Check DATABASE_URL in .env file
- Verify postgres user password
- Create database: `CREATE DATABASE dailysync;`

#### 3. "Port already in use"
**Problem:** Ports 3000 or 3001 are occupied
**Solution:**
```cmd
# Find and kill processes using the ports
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 4. "Redis connection failed"
**Problem:** Redis not running
**Solution:**
- Start Redis service
- Or install Redis using one of the methods above
- Application will work without Redis (background jobs disabled)

#### 5. "Permission denied" errors
**Problem:** Insufficient permissions
**Solution:**
- Run Command Prompt as Administrator
- Check file permissions in project directory

#### 6. "Dependencies installation failed"
**Problem:** Network or npm issues
**Solution:**
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s /q node_modules
npm install
```

### Alternative Solutions

#### Use Docker (Recommended for complex setups)
If you encounter multiple installation issues:
1. Install Docker Desktop
2. Run: `docker-setup.bat`
3. All dependencies will be containerized

#### Use Windows Subsystem for Linux (WSL)
For a Linux-like environment:
1. Install WSL2: `wsl --install`
2. Install Ubuntu from Microsoft Store
3. Follow Linux installation instructions in WSL

## 📊 Verification Steps

After installation, verify everything works:

1. **Check Services:**
   ```cmd
   # Run the system check
   system-check.bat
   ```

2. **Test API:**
   ```cmd
   # Test API endpoints
   node scripts/test-api.js
   ```

3. **Open Testing Checklist:**
   - Open `testing-checklist.html` in browser
   - Follow the interactive testing guide

## 🆘 Getting Help

If you still have issues:

1. **Check Logs:**
   - Look at terminal output for error messages
   - Check browser console for frontend errors

2. **Run Diagnostics:**
   ```cmd
   troubleshoot.bat
   ```

3. **Common Commands:**
   ```cmd
   # Restart everything
   npm run dev

   # Reset database
   npm run db:reset

   # Check service status
   check-services.bat
   ```

4. **Documentation:**
   - Read `TESTING_GUIDE.md` for comprehensive testing
   - Check `docs/` folder for detailed documentation

## 🎉 Success!

Once everything is running:
1. Open http://localhost:3000
2. Login with default credentials
3. Explore the DailySync features
4. Use the testing checklist for comprehensive validation

The DailySync application is now ready for development and testing!
