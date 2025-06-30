@echo off
setlocal enabledelayedexpansion

echo 🚀 DailySync Testing Setup
echo ==========================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: !NODE_VERSION!
    
    REM Extract major version number
    for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:v=!") do set MAJOR_VERSION=%%a
    if !MAJOR_VERSION! geq 18 (
        echo ✅ Node.js version is compatible (18+)
    ) else (
        echo ❌ Node.js version must be 18 or higher. Current: !NODE_VERSION!
        pause
        exit /b 1
    )
) else (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo.

REM Check if pnpm is installed
echo Checking pnpm installation...
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✅ pnpm is installed: !PNPM_VERSION!
) else (
    echo ⚠️ pnpm is not installed. Installing pnpm...
    npm install -g pnpm
    if %errorlevel% equ 0 (
        echo ✅ pnpm installed successfully
    ) else (
        echo ❌ Failed to install pnpm
        pause
        exit /b 1
    )
)
echo.

REM Check if PostgreSQL is available
echo Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL client is available
    
    REM Try to check if server is running (this might fail if not configured)
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL server is running
    ) else (
        echo ⚠️ PostgreSQL server is not running or not accessible
        echo Please start PostgreSQL server before continuing
    )
) else (
    echo ⚠️ PostgreSQL client not found. Please install PostgreSQL 15+
)
echo.

REM Check if Redis is available
echo Checking Redis...
redis-cli --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis client is available
    
    REM Try to ping Redis server
    redis-cli ping >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Redis server is running
    ) else (
        echo ⚠️ Redis server is not running or not accessible
        echo Please start Redis server before continuing
    )
) else (
    echo ⚠️ Redis client not found. Please install Redis 7+
)
echo.

REM Install dependencies
echo Installing dependencies...
if exist "package.json" (
    pnpm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully
    ) else (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ❌ package.json not found. Are you in the correct directory?
    pause
    exit /b 1
)
echo.

REM Setup environment file
echo Setting up environment file...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Environment file created from .env.example
        echo ⚠️ Please edit .env file with your local configuration
    ) else (
        echo ⚠️ .env.example not found. Creating basic .env file...
        (
            echo # Database
            echo DATABASE_URL="postgresql://postgres:password@localhost:5432/dailysync_dev"
            echo.
            echo # Redis
            echo REDIS_URL="redis://localhost:6379"
            echo.
            echo # Authentication
            echo JWT_SECRET="your-super-secret-jwt-key-for-development"
            echo NEXTAUTH_SECRET="your-nextauth-secret-key"
            echo NEXTAUTH_URL="http://localhost:3000"
            echo.
            echo # API Configuration
            echo API_PORT=3001
            echo WEBHOOK_API_KEY="dev-webhook-api-key"
            echo.
            echo # Development
            echo NODE_ENV="development"
        ) > .env
        echo ✅ Basic .env file created
        echo ⚠️ Please edit .env file with your actual database credentials
    )
) else (
    echo ✅ Environment file already exists
)
echo.

REM Setup database
echo Setting up database...

echo Generating Prisma client...
pnpm db:generate
if %errorlevel% equ 0 (
    echo ✅ Prisma client generated
) else (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo Running database migrations...
pnpm db:migrate
if %errorlevel% equ 0 (
    echo ✅ Database migrations completed
) else (
    echo ❌ Database migrations failed. Please check your database connection
    echo.
    goto :skip_seed
)

echo Seeding database with test data...
pnpm db:seed
if %errorlevel% equ 0 (
    echo ✅ Database seeded successfully
) else (
    echo ⚠️ Database seeding failed. You may need to seed manually
)

:skip_seed
echo.

REM Create test scripts
echo Creating test scripts...

if exist "scripts\test-api.js" (
    echo ✅ API test script is ready
)

REM Create quick test runner batch file
(
    echo @echo off
    echo echo 🧪 Running Quick API Tests...
    echo node scripts/test-api.js
    echo pause
) > test-quick.bat

echo ✅ Quick test runner created (test-quick.bat)
echo.

echo ✅ Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your database credentials
echo 2. Start the services: pnpm dev
echo 3. Run tests: test-quick.bat
echo 4. Open browser: http://localhost:3000
echo.
echo For comprehensive testing, follow the TESTING_GUIDE.md
echo.
pause
