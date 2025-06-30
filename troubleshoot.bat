@echo off
setlocal enabledelayedexpansion

echo 🔧 DailySync Troubleshooting Tool
echo ================================
echo.

echo [SYSTEM CHECK]
echo --------------

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js: Not installed or not in PATH
    echo   Download from: https://nodejs.org/
)

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i
) else (
    echo ❌ npm: Not available
)

REM Check pnpm
echo Checking pnpm...
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do echo ✅ pnpm: %%i
) else (
    echo ⚠️ pnpm: Not installed (will use npm)
)

echo.
echo [DATABASE CHECK]
echo ---------------

REM Check PostgreSQL
echo Checking PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL: Running on localhost:5432
) else (
    echo ❌ PostgreSQL: Not running or not accessible
    echo   Install from: https://postgresql.org/download/
    echo   Or start the PostgreSQL service
)

REM Check Redis
echo Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis: Running and responding
) else (
    echo ❌ Redis: Not running or not accessible
    echo   Install from: https://redis.io/download
    echo   For Windows: https://github.com/microsoftarchive/redis/releases
)

echo.
echo [PROJECT CHECK]
echo --------------

REM Check if in correct directory
if exist "package.json" (
    echo ✅ package.json: Found
) else (
    echo ❌ package.json: Not found
    echo   Make sure you're in the dailysync project directory
)

REM Check .env file
if exist ".env" (
    echo ✅ .env: Found
) else (
    echo ⚠️ .env: Not found
    if exist ".env.example" (
        echo   Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo ✅ .env: Created
    ) else (
        echo ❌ .env.example: Not found
    )
)

REM Check node_modules
if exist "node_modules" (
    echo ✅ node_modules: Found
) else (
    echo ❌ node_modules: Not found
    echo   Run: npm install or pnpm install
)

echo.
echo [PORT CHECK]
echo -----------

REM Check if ports are in use
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Port 3000: In use
    echo   Kill process or use different port
) else (
    echo ✅ Port 3000: Available
)

netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Port 3001: In use
    echo   Kill process or use different port
) else (
    echo ✅ Port 3001: Available
)

echo.
echo [QUICK FIXES]
echo ------------
echo.
echo If you're having issues, try these solutions:
echo.
echo 1. INSTALL DEPENDENCIES:
echo    npm install
echo    (or pnpm install if you have pnpm)
echo.
echo 2. START POSTGRESQL:
echo    - Windows: Start PostgreSQL service from Services panel
echo    - Or install from: https://postgresql.org/download/
echo.
echo 3. START REDIS:
echo    - Windows: Download and run Redis server
echo    - From: https://github.com/microsoftarchive/redis/releases
echo.
echo 4. CREATE DATABASE:
echo    psql -U postgres
echo    CREATE DATABASE dailysync;
echo    \q
echo.
echo 5. SETUP DATABASE:
echo    npm run db:generate
echo    npm run db:migrate
echo    npm run db:seed
echo.
echo 6. START APPLICATION:
echo    npm run dev
echo    (or pnpm dev)
echo.
echo 7. ALTERNATIVE STARTUP:
echo    cd apps/web
echo    npm run dev
echo    (in another terminal)
echo    cd apps/api  
echo    npm run dev
echo.
echo 8. CLEAR CACHE AND REINSTALL:
echo    rmdir /s node_modules
echo    npm cache clean --force
echo    npm install
echo.
echo 9. CHECK FIREWALL:
echo    Make sure Windows Firewall allows Node.js
echo.
echo 10. RUN AS ADMINISTRATOR:
echo     Right-click Command Prompt and "Run as administrator"
echo.

echo [MANUAL STARTUP COMMANDS]
echo ------------------------
echo.
echo If the automated script fails, try these manual commands:
echo.
echo # Install dependencies
echo npm install
echo.
echo # Setup database (make sure PostgreSQL is running)
echo npm run db:generate
echo npm run db:migrate  
echo npm run db:seed
echo.
echo # Start development servers
echo npm run dev
echo.
echo # Or start individually:
echo # Terminal 1: cd apps/api && npm run dev
echo # Terminal 2: cd apps/web && npm run dev
echo.

pause
