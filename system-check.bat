@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🔍 DailySync System Requirements Check
echo ========================================
echo.

set "ISSUES_FOUND=0"
set "INSTALL_NEEDED="

echo [1/5] CHECKING NODE.JS
echo --------------------
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: !NODE_VERSION!
    
    REM Extract major version
    for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:v=!") do set MAJOR_VERSION=%%a
    if !MAJOR_VERSION! geq 18 (
        echo ✅ Node.js version is compatible (18+)
    ) else (
        echo ❌ Node.js version is too old. Need 18+, found !NODE_VERSION!
        set /a ISSUES_FOUND+=1
        set "INSTALL_NEEDED=!INSTALL_NEEDED! nodejs"
    )
) else (
    echo ❌ Node.js is NOT installed
    set /a ISSUES_FOUND+=1
    set "INSTALL_NEEDED=!INSTALL_NEEDED! nodejs"
)

echo.
echo [2/5] CHECKING PACKAGE MANAGERS
echo ------------------------------
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm is available: %%i
) else (
    echo ❌ npm is NOT available
    set /a ISSUES_FOUND+=1
)

pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do echo ✅ pnpm is available: %%i
) else (
    echo ⚠️ pnpm is not installed (will install if Node.js is available)
)

echo.
echo [3/5] CHECKING POSTGRESQL
echo -------------------------
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is running on localhost:5432
    
    REM Try to get version
    psql --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=3" %%i in ('psql --version') do echo ✅ PostgreSQL version: %%i
    )
) else (
    echo ❌ PostgreSQL is NOT running or not accessible
    
    REM Check if PostgreSQL is installed but not running
    psql --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️ PostgreSQL is installed but not running
        echo   Try starting the PostgreSQL service
    ) else (
        echo ❌ PostgreSQL is NOT installed
        set /a ISSUES_FOUND+=1
        set "INSTALL_NEEDED=!INSTALL_NEEDED! postgresql"
    )
)

echo.
echo [4/5] CHECKING REDIS
echo -------------------
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is running and responding
    
    REM Try to get version
    redis-cli --version >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('redis-cli --version') do echo ✅ Redis version: %%i
    )
) else (
    echo ❌ Redis is NOT running or not accessible
    
    REM Check if Redis is installed
    redis-server --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️ Redis is installed but not running
        echo   Try starting Redis server
    ) else (
        echo ❌ Redis is NOT installed
        set /a ISSUES_FOUND+=1
        set "INSTALL_NEEDED=!INSTALL_NEEDED! redis"
    )
)

echo.
echo [5/5] CHECKING PROJECT FILES
echo ---------------------------
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found - are you in the correct directory?
    set /a ISSUES_FOUND+=1
)

if exist ".env" (
    echo ✅ .env file exists
) else (
    echo ⚠️ .env file missing (will be created)
)

if exist "node_modules" (
    echo ✅ node_modules directory exists
) else (
    echo ⚠️ node_modules missing (dependencies need to be installed)
)

echo.
echo ========================================
echo 📊 SYSTEM CHECK SUMMARY
echo ========================================

if %ISSUES_FOUND% equ 0 (
    echo ✅ ALL REQUIREMENTS MET!
    echo Your system is ready to run DailySync.
    echo.
    echo Next steps:
    echo 1. Run: install-dependencies.bat
    echo 2. Run: setup-database.bat  
    echo 3. Run: start-application.bat
) else (
    echo ❌ ISSUES FOUND: %ISSUES_FOUND%
    echo.
    echo Missing components: %INSTALL_NEEDED%
    echo.
    echo INSTALLATION REQUIRED:
    echo.
    
    echo %INSTALL_NEEDED% | findstr "nodejs" >nul
    if !errorlevel! equ 0 (
        echo 📥 INSTALL NODE.JS:
        echo   1. Go to: https://nodejs.org/
        echo   2. Download LTS version (18.x or higher)
        echo   3. Run installer and check "Add to PATH"
        echo   4. Restart Command Prompt
        echo   5. Verify: node --version
        echo.
    )
    
    echo %INSTALL_NEEDED% | findstr "postgresql" >nul
    if !errorlevel! equ 0 (
        echo 📥 INSTALL POSTGRESQL:
        echo   1. Go to: https://www.postgresql.org/download/windows/
        echo   2. Download PostgreSQL 15+ installer
        echo   3. Install with default settings
        echo   4. Remember the password you set for 'postgres' user
        echo   5. Start PostgreSQL service
        echo   6. Verify: pg_isready -h localhost -p 5432
        echo.
    )
    
    echo %INSTALL_NEEDED% | findstr "redis" >nul
    if !errorlevel! equ 0 (
        echo 📥 INSTALL REDIS:
        echo   Option 1 - Redis for Windows:
        echo   1. Go to: https://github.com/microsoftarchive/redis/releases
        echo   2. Download Redis-x64-3.0.504.msi
        echo   3. Install and start Redis service
        echo.
        echo   Option 2 - Redis via Chocolatey:
        echo   1. Install Chocolatey: https://chocolatey.org/install
        echo   2. Run: choco install redis-64
        echo   3. Start Redis: redis-server
        echo.
        echo   Option 3 - Use Docker:
        echo   1. Install Docker Desktop
        echo   2. Run: docker run -d -p 6379:6379 redis:7-alpine
        echo.
    )
)

echo.
echo ========================================
echo 🛠️ QUICK FIXES
echo ========================================
echo.
echo If you have installation issues:
echo.
echo 1. RUN AS ADMINISTRATOR:
echo    Right-click Command Prompt → "Run as administrator"
echo.
echo 2. ALTERNATIVE - USE DOCKER:
echo    If installations fail, use Docker instead:
echo    - Install Docker Desktop
echo    - Run: docker-compose up -d
echo.
echo 3. CHOCOLATEY PACKAGE MANAGER:
echo    Install Chocolatey for easier Windows package management:
echo    https://chocolatey.org/install
echo    Then: choco install nodejs postgresql redis-64
echo.
echo 4. WINDOWS SUBSYSTEM FOR LINUX (WSL):
echo    Install WSL2 and run DailySync in Linux environment:
echo    wsl --install
echo.

pause
