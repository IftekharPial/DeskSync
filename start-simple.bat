@echo off
echo 🚀 DailySync Simple Startup (Using npm)
echo =======================================
echo.

echo [1/5] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo Try running as administrator or check your internet connection
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo [2/5] Creating .env file if needed...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env file created from .env.example
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
            echo.
            echo # Environment
            echo NODE_ENV="development"
        ) > .env
        echo ✅ Basic .env file created
    )
) else (
    echo ✅ .env file already exists
)
echo.

echo [3/5] Setting up database...
echo Make sure PostgreSQL is running on localhost:5432
echo.

echo Generating Prisma client...
npm run db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    echo Make sure PostgreSQL is running and DATABASE_URL is correct
    echo.
    echo To fix:
    echo 1. Start PostgreSQL service
    echo 2. Create database: CREATE DATABASE dailysync;
    echo 3. Update DATABASE_URL in .env file
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo Running migrations...
npm run db:migrate
if %errorlevel% neq 0 (
    echo ❌ Database migrations failed
    echo.
    echo To fix:
    echo 1. Make sure PostgreSQL is running
    echo 2. Create the database: CREATE DATABASE dailysync;
    echo 3. Check DATABASE_URL in .env
    pause
    exit /b 1
)
echo ✅ Migrations completed

echo Seeding database...
npm run db:seed
if %errorlevel% neq 0 (
    echo ⚠️ Database seeding failed (continuing anyway)
    echo You can seed manually later with: npm run db:seed
)
echo ✅ Database setup completed
echo.

echo [4/5] Checking services...
echo Make sure Redis is running on localhost:6379
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Redis is not running - background jobs may not work
    echo Install Redis from: https://redis.io/download
) else (
    echo ✅ Redis is running
)
echo.

echo [5/5] Starting development servers...
echo.
echo 🌐 Application will be available at:
echo   • Web App: http://localhost:3000
echo   • API: http://localhost:3001/api/health
echo.
echo 🔑 Login credentials:
echo   • User: user@example.com / password123  
echo   • Admin: admin@example.com / admin123
echo.
echo Press Ctrl+C to stop all services
echo.

npm run dev
