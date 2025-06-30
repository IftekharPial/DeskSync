# 🚀 DailySync Manual Setup Steps

Since automated terminal execution is having issues, please follow these manual steps:

## Step 1: Install Node.js (REQUIRED)

### Option A: Direct Download (Recommended)
1. **Open your web browser**
2. **Go to:** https://nodejs.org/
3. **Download:** LTS version (18.x or higher) - Windows Installer (.msi)
4. **Run the installer:**
   - Double-click the downloaded .msi file
   - Follow the installation wizard
   - **IMPORTANT:** Make sure "Add to PATH" is checked
   - Accept all default settings
5. **Restart Command Prompt/PowerShell**

### Option B: Using PowerShell (Run as Administrator)
```powershell
# Open PowerShell as Administrator
# Copy and paste this command:
$url = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
$output = "$env:TEMP\nodejs-installer.msi"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process msiexec.exe -Wait -ArgumentList "/i `"$output`" /quiet /norestart"
Remove-Item $output
```

### Option C: Using winget
```cmd
winget install OpenJS.NodeJS
```

## Step 2: Verify Node.js Installation

Open a **new** Command Prompt or PowerShell window and run:
```cmd
node --version
npm --version
```

You should see version numbers like:
```
v18.19.0
9.2.0
```

## Step 3: Install PostgreSQL (REQUIRED)

### Option A: Direct Download
1. **Go to:** https://www.postgresql.org/download/windows/
2. **Download:** PostgreSQL 15+ installer
3. **Run installer:**
   - Set a password for 'postgres' user (remember this!)
   - Use default port 5432
   - Install with default components
4. **Start PostgreSQL service** (usually starts automatically)

### Option B: Using Chocolatey (if you have it)
```cmd
choco install postgresql
```

## Step 4: Install Redis (OPTIONAL but recommended)

### Option A: Redis for Windows
1. **Go to:** https://github.com/microsoftarchive/redis/releases
2. **Download:** Redis-x64-3.0.504.msi
3. **Install and start** the Redis service

### Option B: Docker Redis (if you have Docker)
```cmd
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

## Step 5: Setup DailySync Application

1. **Open Command Prompt or PowerShell**
2. **Navigate to the DailySync directory:**
   ```cmd
   cd path\to\dailysync
   ```
3. **Run the automated setup:**
   ```cmd
   setup-complete.bat
   ```

## Step 6: Alternative - Docker Setup (If Node.js installation fails)

If you have Docker Desktop installed:
```cmd
docker-setup.bat
```

## Step 7: Manual Setup (If automated scripts fail)

```cmd
# 1. Install dependencies
npm install

# 2. Create environment file
copy .env.example .env

# 3. Setup database (make sure PostgreSQL is running)
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start application
npm run dev
```

## Step 8: Verification

After setup, verify the application is running:

1. **Web Application:** http://localhost:3000
2. **API Health:** http://localhost:3001/api/health

**Login Credentials:**
- User: user@example.com / password123
- Admin: admin@example.com / admin123

## Troubleshooting

### If Node.js installation fails:
- Run PowerShell as Administrator
- Try the direct download method
- Check Windows version compatibility

### If PostgreSQL connection fails:
- Make sure PostgreSQL service is running
- Check if port 5432 is available
- Verify DATABASE_URL in .env file

### If ports are in use:
```cmd
# Find processes using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill processes (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### If all else fails:
Use the Docker setup which includes all dependencies:
```cmd
docker-setup.bat
```

## Quick Commands Reference

```cmd
# Check if Node.js is installed
node --version

# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check if Redis is running
redis-cli ping

# Run system check
system-check.bat

# Complete setup
setup-complete.bat

# Start application manually
npm run dev

# Docker alternative
docker-setup.bat
```

## Next Steps After Installation

1. **Open testing checklist:** testing-checklist.html
2. **Run API tests:** node scripts/test-api.js
3. **Read documentation:** docs/user-guide.md
4. **Explore features** at http://localhost:3000

---

**The most important step is installing Node.js 18+ first. Everything else can be automated after that.**
