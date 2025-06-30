@echo off
echo 🔍 Checking DailySync Services Status
echo ====================================
echo.

echo Checking PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is running
) else (
    echo ❌ PostgreSQL is not running or not accessible
    echo Please start PostgreSQL service
)

echo.
echo Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is running
) else (
    echo ❌ Redis is not running or not accessible
    echo Please start Redis service
)

echo.
echo Checking API Server...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API Server is running on port 3001
) else (
    echo ❌ API Server is not responding on port 3001
)

echo.
echo Checking Web Application...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Web Application is running on port 3000
) else (
    echo ❌ Web Application is not responding on port 3000
)

echo.
echo Service URLs:
echo - Web App: http://localhost:3000
echo - API Health: http://localhost:3001/api/health
echo - API Docs: http://localhost:3001/api/docs
echo.

pause
