@echo off
echo ========================================
echo 🚀 Node.js Installation Script
echo ========================================
echo.
echo This script will download and install Node.js 18 LTS
echo.

set /p CONTINUE="Press Enter to continue or Ctrl+C to cancel..."

echo.
echo 📥 Downloading Node.js installer...
echo.

REM Download Node.js using PowerShell
powershell.exe -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'nodejs-installer.msi'}"

if %errorlevel% neq 0 (
    echo ❌ Download failed!
    echo.
    echo Please download manually from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Download completed
echo.
echo 🔧 Installing Node.js...
echo This may take a few minutes...
echo.

REM Install Node.js silently
msiexec /i nodejs-installer.msi /quiet /norestart

if %errorlevel% neq 0 (
    echo ❌ Installation failed!
    echo.
    echo Please run the installer manually: nodejs-installer.msi
    pause
    exit /b 1
)

echo ✅ Installation completed
echo.
echo 🧹 Cleaning up...
del nodejs-installer.msi

echo.
echo ========================================
echo ✅ NODE.JS INSTALLATION COMPLETE!
echo ========================================
echo.
echo Please:
echo 1. Close this window
echo 2. Open a NEW Command Prompt or PowerShell
echo 3. Run: node --version
echo 4. Run: setup-complete.bat
echo.

pause
