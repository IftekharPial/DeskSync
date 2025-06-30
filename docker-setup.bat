@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🐳 DailySync Docker Setup (Alternative)
echo ========================================
echo.
echo This is an alternative setup using Docker.
echo Use this if you have issues with local Node.js installation.
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running!
    echo.
    echo Please install Docker Desktop:
    echo 1. Go to: https://www.docker.com/products/docker-desktop/
    echo 2. Download and install Docker Desktop for Windows
    echo 3. Start Docker Desktop
    echo 4. Wait for Docker to be ready (check system tray)
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do echo ✅ Docker available: %%i

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available!
    echo Please ensure Docker Desktop is properly installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('docker-compose --version') do echo ✅ Docker Compose available: %%i
echo.

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml not found!
    echo Make sure you're in the DailySync project directory
    pause
    exit /b 1
)

echo ✅ Docker Compose configuration found
echo.

REM Create .env file for Docker
echo Creating environment file for Docker...
if not exist ".env" (
    (
        echo # Docker Environment Configuration
        echo POSTGRES_DB=dailysync
        echo POSTGRES_USER=dailysync_user
        echo POSTGRES_PASSWORD=dailysync_password
        echo.
        echo # Application Configuration
        echo JWT_SECRET=dailysync-jwt-secret-docker
        echo NEXTAUTH_SECRET=dailysync-nextauth-secret-docker
        echo WEBHOOK_API_KEY=docker-webhook-api-key
        echo GRAFANA_PASSWORD=admin
        echo.
        echo # Database URL for containers
        echo DATABASE_URL=postgresql://dailysync_user:dailysync_password@postgres:5432/dailysync
        echo REDIS_URL=redis://redis:6379
    ) > .env
    echo ✅ .env file created for Docker
) else (
    echo ✅ .env file already exists
)
echo.

echo Starting DailySync with Docker...
echo This will download and start all required services:
echo • PostgreSQL database
echo • Redis cache
echo • DailySync API server
echo • DailySync web application
echo • Monitoring tools (Grafana, Prometheus)
echo.

set /p CONTINUE="Press Enter to continue or Ctrl+C to cancel..."
echo.

REM Pull latest images
echo Pulling Docker images...
docker-compose pull
echo.

REM Start services
echo Starting all services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services!
    echo.
    echo Troubleshooting:
    echo 1. Make sure Docker Desktop is running
    echo 2. Check if ports 3000, 3001, 5432, 6379 are available
    echo 3. Try: docker-compose down && docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo ✅ Docker services started successfully
echo.

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 10 >nul

REM Check service status
echo Checking service status...
docker-compose ps

echo.
echo Running database migrations...
docker-compose exec -T api npm run db:migrate
if %errorlevel% neq 0 (
    echo ⚠️ Database migration failed, but continuing...
)

echo.
echo Seeding database...
docker-compose exec -T api npm run db:seed
if %errorlevel% neq 0 (
    echo ⚠️ Database seeding failed, but continuing...
)

echo.
echo ========================================
echo 🎉 DOCKER SETUP COMPLETE!
echo ========================================
echo.
echo 🌐 Services are available at:
echo   • Web Application: http://localhost:3000
echo   • API Server: http://localhost:3001
echo   • API Health: http://localhost:3001/api/health
echo   • Grafana Monitoring: http://localhost:3002
echo   • Prometheus: http://localhost:9090
echo.
echo 🔑 Login credentials:
echo   • App User: user@example.com / password123
echo   • App Admin: admin@example.com / admin123
echo   • Grafana: admin / admin
echo.
echo 🐳 Docker commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart: docker-compose restart
echo   • Rebuild: docker-compose build --no-cache
echo.
echo 📊 Service status:
docker-compose ps
echo.

echo Opening web application in browser...
start http://localhost:3000

echo.
pause
