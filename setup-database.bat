@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🗄️ DailySync Database Setup
echo ========================================
echo.

REM Check if Node.js and dependencies are available
if not exist "node_modules" (
    echo ❌ Dependencies not installed!
    echo Please run: install-dependencies.bat first
    pause
    exit /b 1
)

REM Determine package manager
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    set RUN_CMD=pnpm
) else (
    set RUN_CMD=npm run
)

echo Using package manager: %RUN_CMD%
echo.

REM Create .env file if it doesn't exist
echo [1/6] Setting up environment configuration...
if not exist ".env" (
    echo Creating .env file...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env created from .env.example
    ) else (
        echo Creating basic .env file...
        (
            echo # Database
            echo DATABASE_URL="postgresql://postgres:password@localhost:5432/dailysync"
            echo.
            echo # NextAuth.js
            echo NEXTAUTH_URL="http://localhost:3000"
            echo NEXTAUTH_SECRET="dailysync-nextauth-secret-key-development"
            echo.
            echo # JWT
            echo JWT_SECRET="dailysync-jwt-secret-key-for-development"
            echo.
            echo # Redis
            echo REDIS_URL="redis://localhost:6379"
            echo.
            echo # API Configuration
            echo API_PORT=3001
            echo API_BASE_URL="http://localhost:3001"
            echo WEBHOOK_API_KEY="dev-webhook-api-key"
            echo.
            echo # Environment
            echo NODE_ENV="development"
            echo LOG_LEVEL="info"
        ) > .env
        echo ✅ Basic .env file created
    )
    
    echo.
    echo ⚠️ IMPORTANT: Update the DATABASE_URL in .env file if needed
    echo Current setting: postgresql://postgres:password@localhost:5432/dailysync
    echo.
    echo If your PostgreSQL has different credentials:
    echo 1. Open .env file in notepad
    echo 2. Update DATABASE_URL with your username/password
    echo 3. Save the file
    echo.
    set /p CONTINUE="Press Enter to continue or Ctrl+C to edit .env first..."
) else (
    echo ✅ .env file already exists
)
echo.

REM Check PostgreSQL connection
echo [2/6] Checking PostgreSQL connection...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not running or not accessible!
    echo.
    echo Please ensure PostgreSQL is running:
    echo 1. Start PostgreSQL service from Windows Services
    echo 2. Or start from pgAdmin
    echo 3. Or run: net start postgresql-x64-15 (adjust version)
    echo.
    echo If PostgreSQL is not installed:
    echo 1. Download from: https://www.postgresql.org/download/windows/
    echo 2. Install with default settings
    echo 3. Remember the password for 'postgres' user
    echo.
    pause
    exit /b 1
)
echo ✅ PostgreSQL is running
echo.

REM Check if database exists, create if not
echo [3/6] Checking/creating database...
psql -h localhost -p 5432 -U postgres -d dailysync -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo Database 'dailysync' doesn't exist, creating it...
    echo.
    echo You may be prompted for the PostgreSQL password...
    psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE dailysync;"
    if %errorlevel% neq 0 (
        echo ❌ Failed to create database!
        echo.
        echo Manual steps:
        echo 1. Open pgAdmin or psql
        echo 2. Connect as postgres user
        echo 3. Run: CREATE DATABASE dailysync;
        echo 4. Run this script again
        pause
        exit /b 1
    )
    echo ✅ Database 'dailysync' created
) else (
    echo ✅ Database 'dailysync' already exists
)
echo.

REM Check Redis connection
echo [4/6] Checking Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Redis is not running or not accessible!
    echo.
    echo Please ensure Redis is running:
    echo 1. Start Redis service if installed
    echo 2. Or run: redis-server (if installed manually)
    echo.
    echo If Redis is not installed:
    echo Option 1: Download from https://github.com/microsoftarchive/redis/releases
    echo Option 2: Use Docker: docker run -d -p 6379:6379 redis:7-alpine
    echo Option 3: Install via Chocolatey: choco install redis-64
    echo.
    echo ⚠️ Continuing without Redis (background jobs won't work)
    pause
) else (
    echo ✅ Redis is running
)
echo.

REM Generate Prisma client
echo [5/6] Generating Prisma client...
%RUN_CMD% db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client!
    echo.
    echo This usually means:
    echo 1. Database connection failed
    echo 2. DATABASE_URL in .env is incorrect
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database 'dailysync' exists
    echo 3. DATABASE_URL in .env is correct
    echo.
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

REM Run database migrations
echo [6/6] Running database migrations...
%RUN_CMD% db:migrate
if %errorlevel% neq 0 (
    echo ❌ Database migrations failed!
    echo.
    echo Troubleshooting:
    echo 1. Check PostgreSQL connection
    echo 2. Verify database permissions
    echo 3. Check DATABASE_URL in .env
    echo.
    echo Manual migration:
    echo 1. Open packages/database/prisma/
    echo 2. Run: npx prisma migrate dev
    echo.
    pause
    exit /b 1
)
echo ✅ Database migrations completed
echo.

REM Seed database with test data
echo Seeding database with test data...
%RUN_CMD% db:seed
if %errorlevel% neq 0 (
    echo ⚠️ Database seeding failed (continuing anyway)
    echo You can seed manually later with: %RUN_CMD% db:seed
    echo.
    echo Default users may not be available for testing
) else (
    echo ✅ Database seeded with test data
    echo.
    echo 🔑 Default login credentials created:
    echo   User: user@example.com / password123
    echo   Admin: admin@example.com / admin123
)
echo.

echo ========================================
echo ✅ DATABASE SETUP COMPLETE!
echo ========================================
echo.
echo Database: PostgreSQL connected and migrated
echo Redis: %REDIS_STATUS%
echo Test data: Seeded successfully
echo.
echo Next step:
echo Run: start-application.bat
echo.

pause
