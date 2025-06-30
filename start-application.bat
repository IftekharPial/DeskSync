@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🚀 Starting DailySync Application
echo ========================================
echo.

REM Check prerequisites
echo [1/3] Checking prerequisites...

if not exist "node_modules" (
    echo ❌ Dependencies not installed!
    echo Please run: install-dependencies.bat first
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ Environment file missing!
    echo Please run: setup-database.bat first
    pause
    exit /b 1
)

REM Determine package manager
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    set RUN_CMD=pnpm dev
    set PKG_NAME=pnpm
) else (
    set RUN_CMD=npm run dev
    set PKG_NAME=npm
)

echo ✅ Using package manager: %PKG_NAME%
echo.

REM Check services
echo [2/3] Checking required services...

REM Check PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is running
) else (
    echo ❌ PostgreSQL is not running!
    echo Please start PostgreSQL service and try again
    pause
    exit /b 1
)

REM Check Redis (optional but recommended)
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is running
    set REDIS_STATUS=✅ Available
) else (
    echo ⚠️ Redis is not running (background jobs will be disabled)
    set REDIS_STATUS=⚠️ Not available
)

REM Check if ports are available
echo.
echo Checking port availability...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Port 3000 is in use
    echo Attempting to find and stop conflicting process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Port 3001 is in use
    echo Attempting to find and stop conflicting process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

echo ✅ Ports checked and cleared
echo.

REM Start the application
echo [3/3] Starting development servers...
echo.
echo 🌐 DailySync will be available at:
echo   • Web Application: http://localhost:3000
echo   • API Server: http://localhost:3001
echo   • API Health Check: http://localhost:3001/api/health
echo.
echo 🔑 Default login credentials:
echo   • Regular User: user@example.com / password123
echo   • Admin User: admin@example.com / admin123
echo.
echo 📊 Services status:
echo   • PostgreSQL: ✅ Running
echo   • Redis: %REDIS_STATUS%
echo   • Package Manager: %PKG_NAME%
echo.
echo 📋 Testing resources:
echo   • Interactive checklist: testing-checklist.html
echo   • API testing: node scripts/test-api.js
echo   • Load testing: artillery run scripts/load-test.yml
echo.
echo ⚠️ Press Ctrl+C to stop all services
echo.
echo Starting servers now...
echo ========================================
echo.

REM Start the development servers
%RUN_CMD%

REM If we get here, the servers have stopped
echo.
echo ========================================
echo 🛑 DailySync servers have stopped
echo ========================================
echo.

pause
