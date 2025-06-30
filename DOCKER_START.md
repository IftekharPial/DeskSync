# 🐳 DailySync Docker Quick Start

Since Node.js is not installed, you can use Docker to run the application without installing Node.js locally.

## Prerequisites

1. **Install Docker Desktop:**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Make sure Docker is running (check system tray)

## Quick Start with Docker

### Option 1: Full Stack with Docker Compose (Recommended)

```bash
# Start all services (database, API, web app, monitoring)
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Development with Docker (Node.js in container)

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
docker-compose exec api npm run db:migrate

# Seed database
docker-compose exec api npm run db:seed
```

## Service URLs (Docker)

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Grafana Monitoring**: http://localhost:3002
- **Prometheus**: http://localhost:9090

## Default Credentials

- **App User**: user@example.com / password123
- **App Admin**: admin@example.com / admin123
- **Grafana**: admin / admin

## Troubleshooting Docker

1. **Docker not running:**
   ```bash
   # Start Docker Desktop from Start Menu
   ```

2. **Port conflicts:**
   ```bash
   # Stop conflicting services
   docker-compose down
   
   # Check what's using ports
   netstat -ano | findstr :3000
   ```

3. **Build issues:**
   ```bash
   # Rebuild containers
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Database issues:**
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

## Alternative: Install Node.js

If you prefer to install Node.js locally:

1. **Download Node.js 18+ LTS** from https://nodejs.org/
2. **Install with "Add to PATH" option checked**
3. **Restart PowerShell/Command Prompt**
4. **Run**: `node --version` to verify
5. **Then run**: `node quick-start.js`
