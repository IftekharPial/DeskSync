@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting DailySync Development Environment
echo ============================================
echo.

REM Check Node.js
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    echo Alternative: Try using npm instead of pnpm
    echo Run: npm install && npm run dev
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js is available: !NODE_VERSION!
echo.

REM Check/Install pnpm
echo [2/8] Checking package manager...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pnpm globally...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ⚠️ pnpm installation failed, falling back to npm
        set USE_NPM=1
    ) else (
        echo ✅ pnpm installed successfully
    )
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✅ pnpm is available: !PNPM_VERSION!
)
echo.

REM Set package manager command
if defined USE_NPM (
    set PKG_CMD=npm
    set PKG_INSTALL=npm install
    set PKG_RUN=npm run
) else (
    set PKG_CMD=pnpm
    set PKG_INSTALL=pnpm install
    set PKG_RUN=pnpm
)

echo [3/8] Installing dependencies with !PKG_CMD!...
!PKG_INSTALL!
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo.
    echo Troubleshooting tips:
    echo 1. Check your internet connection
    echo 2. Clear npm cache: npm cache clean --force
    echo 3. Delete node_modules and try again
    echo 4. Try running as administrator
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Check if .env exists
echo [4/8] Checking environment configuration...
if not exist ".env" (
    echo ⚠️ .env file not found, creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env file created
    ) else (
        echo ❌ .env.example not found
        echo Please create .env file manually
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file exists
)
echo.

REM Check PostgreSQL
echo [5/8] Checking PostgreSQL connection...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL is not running or not accessible
    echo Please start PostgreSQL service before continuing
    echo.
    echo Windows: Start PostgreSQL service from Services panel
    echo Or install PostgreSQL from: https://postgresql.org/download/
    echo.
    echo Continuing anyway - you may need to fix database connection...
) else (
    echo ✅ PostgreSQL is running
)
echo.

REM Check Redis
echo [6/8] Checking Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Redis is not running or not accessible
    echo Please start Redis service before continuing
    echo.
    echo Windows: Install Redis from: https://redis.io/download
    echo Or use Redis on Windows: https://github.com/microsoftarchive/redis/releases
    echo.
    echo Continuing anyway - background jobs may not work...
) else (
    echo ✅ Redis is running
)
echo.

REM Generate Prisma client
echo [7/8] Setting up database...
echo Generating Prisma client...
!PKG_RUN! db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    echo.
    echo This usually means:
    echo 1. PostgreSQL is not running
    echo 2. DATABASE_URL in .env is incorrect
    echo 3. Database doesn't exist
    echo.
    echo Please fix the database connection and try again
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo Running database migrations...
!PKG_RUN! db:migrate
if %errorlevel% neq 0 (
    echo ❌ Database migrations failed
    echo.
    echo Please check:
    echo 1. PostgreSQL is running and accessible
    echo 2. Database exists (create it if needed)
    echo 3. DATABASE_URL in .env is correct
    echo.
    echo Example: CREATE DATABASE dailysync;
    pause
    exit /b 1
)
echo ✅ Database migrations completed

echo Seeding database with test data...
!PKG_RUN! db:seed
if %errorlevel% neq 0 (
    echo ⚠️ Database seeding failed, but continuing...
    echo You can seed manually later with: !PKG_RUN! db:seed
)
echo ✅ Database setup completed
echo.

REM Start development servers
echo [8/8] Starting development servers...
echo.
echo 🌐 Services will be available at:
echo   • Web Application: http://localhost:3000
echo   • API Server: http://localhost:3001
echo   • API Health: http://localhost:3001/api/health
echo.
echo 🔑 Default login credentials:
echo   • User: user@example.com / password123
echo   • Admin: admin@example.com / admin123
echo.
echo 📋 Testing checklist is available at: testing-checklist.html
echo.
echo ⚠️ Press Ctrl+C to stop all services
echo.

!PKG_RUN! dev
