@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 📦 DailySync Dependencies Installation
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download and install LTS version
    echo 3. Restart Command Prompt
    echo 4. Run this script again
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: !NODE_VERSION!
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ package.json not found!
    echo Make sure you're in the DailySync project directory
    pause
    exit /b 1
)

echo ✅ Project directory confirmed
echo.

REM Install pnpm if not available
echo [1/4] Checking package manager...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pnpm globally...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ⚠️ pnpm installation failed, using npm instead
        set PKG_MANAGER=npm
        set INSTALL_CMD=npm install
        set RUN_CMD=npm run
    ) else (
        echo ✅ pnpm installed successfully
        set PKG_MANAGER=pnpm
        set INSTALL_CMD=pnpm install
        set RUN_CMD=pnpm
    )
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do echo ✅ pnpm available: %%i
    set PKG_MANAGER=pnpm
    set INSTALL_CMD=pnpm install
    set RUN_CMD=pnpm
)
echo.

REM Clear npm cache if needed
echo [2/4] Clearing package cache...
if "%PKG_MANAGER%"=="npm" (
    npm cache clean --force
) else (
    pnpm store prune
)
echo ✅ Cache cleared
echo.

REM Install dependencies
echo [3/4] Installing project dependencies...
echo This may take several minutes...
echo.

%INSTALL_CMD%
if %errorlevel% neq 0 (
    echo ❌ Dependency installation failed!
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Try running as administrator
    echo 3. Delete node_modules folder and try again:
    echo    rmdir /s /q node_modules
    echo    %INSTALL_CMD%
    echo 4. Try using npm instead of pnpm:
    echo    npm install
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Verify installation
echo [4/4] Verifying installation...
if exist "node_modules" (
    echo ✅ node_modules directory created
) else (
    echo ❌ node_modules directory missing
    pause
    exit /b 1
)

REM Check if Turbo is available
%RUN_CMD% --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Package manager working correctly
) else (
    echo ❌ Package manager verification failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DEPENDENCIES INSTALLATION COMPLETE!
echo ========================================
echo.
echo Package manager: %PKG_MANAGER%
echo Dependencies: Installed successfully
echo.
echo Next steps:
echo 1. Run: setup-database.bat (setup PostgreSQL and Redis)
echo 2. Run: start-application.bat (start the application)
echo.
echo Or run the full setup:
echo setup-complete.bat
echo.

pause
