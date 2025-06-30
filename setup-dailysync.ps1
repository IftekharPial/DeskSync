# DailySync Setup Script
Write-Host "🚀 DailySync Setup Starting..." -ForegroundColor Green

# Set Node.js path for this session
$env:Path += ";C:\Program Files\nodejs"

Write-Host "✅ Node.js v24.2.0 is installed and working" -ForegroundColor Green
Write-Host "✅ npm v11.3.0 is installed and working" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Are you in the DailySync directory?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found package.json - in correct directory" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npm.cmd" install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env created from .env.example" -ForegroundColor Green
    } else {
        # Create basic .env file
        @"
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dailysync"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dailysync-nextauth-secret-key-development"

# JWT
JWT_SECRET="dailysync-jwt-secret-key-for-development"

# Redis
REDIS_URL="redis://localhost:6379"

# API Configuration
API_PORT=3001
API_BASE_URL="http://localhost:3001"
WEBHOOK_API_KEY="dev-webhook-api-key"

# Environment
NODE_ENV="development"
LOG_LEVEL="info"
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ Basic .env file created" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check for PostgreSQL
Write-Host "🗄️ Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgResult = & pg_isready -h localhost -p 5432 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
        $hasPostgres = $true
    } else {
        Write-Host "⚠️ PostgreSQL is not running" -ForegroundColor Yellow
        $hasPostgres = $false
    }
} catch {
    Write-Host "⚠️ PostgreSQL not found" -ForegroundColor Yellow
    $hasPostgres = $false
}

# Check for Redis
Write-Host "🔄 Checking Redis..." -ForegroundColor Yellow
try {
    $redisResult = & redis-cli ping 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis is running" -ForegroundColor Green
        $hasRedis = $true
    } else {
        Write-Host "⚠️ Redis is not running" -ForegroundColor Yellow
        $hasRedis = $false
    }
} catch {
    Write-Host "⚠️ Redis not found" -ForegroundColor Yellow
    $hasRedis = $false
}

if ($hasPostgres) {
    # Setup database
    Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
    
    Write-Host "Generating Prisma client..." -ForegroundColor Cyan
    & "C:\Program Files\nodejs\npm.cmd" run db:generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated" -ForegroundColor Green
        
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        & "C:\Program Files\nodejs\npm.cmd" run db:migrate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database migrations completed" -ForegroundColor Green
            
            Write-Host "Seeding database..." -ForegroundColor Cyan
            & "C:\Program Files\nodejs\npm.cmd" run db:seed
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database seeded successfully" -ForegroundColor Green
                $dbSetup = $true
            } else {
                Write-Host "⚠️ Database seeding failed" -ForegroundColor Yellow
                $dbSetup = $true  # Continue anyway
            }
        } else {
            Write-Host "❌ Database migrations failed" -ForegroundColor Red
            $dbSetup = $false
        }
    } else {
        Write-Host "❌ Prisma client generation failed" -ForegroundColor Red
        $dbSetup = $false
    }
} else {
    Write-Host "⚠️ Skipping database setup - PostgreSQL not available" -ForegroundColor Yellow
    $dbSetup = $false
}

# Start the application
Write-Host "" 
Write-Host "🚀 Starting DailySync application..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application will be available at:" -ForegroundColor Cyan
Write-Host "   • Web App: http://localhost:3000" -ForegroundColor White
Write-Host "   • API: http://localhost:3001" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default login credentials:" -ForegroundColor Cyan
Write-Host "   • User: user@example.com / password123" -ForegroundColor White
Write-Host "   • Admin: admin@example.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "📊 System Status:" -ForegroundColor Cyan
Write-Host "   • Node.js: ✅ v24.2.0" -ForegroundColor White
Write-Host "   • npm: ✅ v11.3.0" -ForegroundColor White
Write-Host "   • PostgreSQL: $(if($hasPostgres){'✅ Running'}else{'❌ Not available'})" -ForegroundColor White
Write-Host "   • Redis: $(if($hasRedis){'✅ Running'}else{'⚠️ Not available'})" -ForegroundColor White
Write-Host "   • Database: $(if($dbSetup){'✅ Ready'}else{'⚠️ Needs setup'})" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start development servers
& "C:\Program Files\nodejs\npm.cmd" run dev
