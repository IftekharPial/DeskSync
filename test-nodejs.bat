@echo off
echo Testing Node.js installation...
echo.

REM Add Node.js to PATH for this session
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Testing Node.js...
node --version
if %errorlevel% equ 0 (
    echo ✅ Node.js is working!
) else (
    echo ❌ Node.js failed
)

echo.
echo Testing npm...
npm --version
if %errorlevel% equ 0 (
    echo ✅ npm is working!
) else (
    echo ❌ npm failed
)

echo.
echo Node.js installation test complete.
pause
