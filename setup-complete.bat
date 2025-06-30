@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🎯 DailySync Complete Setup Wizard
echo ========================================
echo.
echo This script will:
echo 1. Check system requirements
echo 2. Install project dependencies  
echo 3. Setup database and environment
echo 4. Start the application
echo.
echo Prerequisites needed:
echo • Node.js 18+ (https://nodejs.org/)
echo • PostgreSQL 15+ (https://postgresql.org/download/windows/)
echo • Redis 7+ (optional, for background jobs)
echo.

set /p CONTINUE="Press Enter to continue or Ctrl+C to exit..."
echo.

REM Step 1: System Check
echo ========================================
echo STEP 1: SYSTEM REQUIREMENTS CHECK
echo ========================================
call system-check.bat
if %errorlevel% neq 0 (
    echo.
    echo ❌ System check failed!
    echo Please install missing requirements and run this script again.
    pause
    exit /b 1
)

echo.
set /p CONTINUE="System check complete. Press Enter to continue..."
echo.

REM Step 2: Install Dependencies
echo ========================================
echo STEP 2: INSTALLING DEPENDENCIES
echo ========================================
call install-dependencies.bat
if %errorlevel% neq 0 (
    echo.
    echo ❌ Dependency installation failed!
    pause
    exit /b 1
)

echo.
set /p CONTINUE="Dependencies installed. Press Enter to continue..."
echo.

REM Step 3: Setup Database
echo ========================================
echo STEP 3: DATABASE SETUP
echo ========================================
call setup-database.bat
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database setup failed!
    pause
    exit /b 1
)

echo.
set /p CONTINUE="Database setup complete. Press Enter to start the application..."
echo.

REM Step 4: Start Application
echo ========================================
echo STEP 4: STARTING APPLICATION
echo ========================================
echo.
echo 🎉 Setup completed successfully!
echo.
echo The DailySync application will now start...
echo.

call start-application.bat

echo.
echo ========================================
echo 📋 SETUP SUMMARY
echo ========================================
echo.
echo ✅ System requirements: Verified
echo ✅ Dependencies: Installed
echo ✅ Database: Configured and seeded
echo ✅ Application: Started
echo.
echo 🌐 Access your application:
echo   Web App: http://localhost:3000
echo   API: http://localhost:3001
echo.
echo 🔑 Login credentials:
echo   User: user@example.com / password123
echo   Admin: admin@example.com / admin123
echo.
echo 📚 Documentation:
echo   • User Guide: docs/user-guide.md
echo   • Admin Guide: docs/admin-guide.md
echo   • API Reference: docs/api-reference.md
echo   • Testing Guide: TESTING_GUIDE.md
echo.
echo 🧪 Testing tools:
echo   • Interactive checklist: testing-checklist.html
echo   • API tests: node scripts/test-api.js
echo   • Load tests: artillery run scripts/load-test.yml
echo.

pause
