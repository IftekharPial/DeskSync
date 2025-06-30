#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DailySync Quick Start');
console.log('========================\n');

// Check Node.js version
console.log('Checking Node.js version...');
const nodeVersion = process.version;
console.log(`✅ Node.js: ${nodeVersion}`);

const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    console.log('❌ Node.js version must be 18 or higher');
    process.exit(1);
}

// Check if package.json exists
if (!fs.existsSync('package.json')) {
    console.log('❌ package.json not found. Are you in the correct directory?');
    process.exit(1);
}
console.log('✅ package.json found');

// Check if .env exists, create if not
if (!fs.existsSync('.env')) {
    console.log('Creating .env file...');
    if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ .env created from .env.example');
    } else {
        // Create basic .env
        const envContent = `# Database
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

# Environment
NODE_ENV="development"
`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ Basic .env file created');
    }
} else {
    console.log('✅ .env file exists');
}

// Function to run command and show output
function runCommand(command, description) {
    console.log(`\n${description}...`);
    try {
        const output = execSync(command, { 
            stdio: 'inherit',
            encoding: 'utf8'
        });
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        console.log(`❌ ${description} failed`);
        console.log(`Error: ${error.message}`);
        return false;
    }
}

// Check if npm is available
try {
    execSync('npm --version', { stdio: 'pipe' });
    console.log('✅ npm is available');
} catch (error) {
    console.log('❌ npm is not available');
    process.exit(1);
}

// Install dependencies
if (!runCommand('npm install', 'Installing dependencies')) {
    console.log('\n❌ Failed to install dependencies');
    console.log('Try running:');
    console.log('1. npm cache clean --force');
    console.log('2. Delete node_modules folder');
    console.log('3. npm install');
    process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('❌ node_modules not found after installation');
    process.exit(1);
}

// Setup database
console.log('\n🗄️ Setting up database...');
console.log('Make sure PostgreSQL is running on localhost:5432');

if (!runCommand('npm run db:generate', 'Generating Prisma client')) {
    console.log('\n❌ Database setup failed');
    console.log('Please check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database exists (CREATE DATABASE dailysync;)');
    console.log('3. DATABASE_URL in .env is correct');
    process.exit(1);
}

if (!runCommand('npm run db:migrate', 'Running database migrations')) {
    console.log('\n❌ Database migrations failed');
    console.log('Please check your database connection');
    process.exit(1);
}

// Try to seed database (optional)
console.log('\nSeeding database...');
try {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded');
} catch (error) {
    console.log('⚠️ Database seeding failed (continuing anyway)');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n🚀 Starting development servers...');
console.log('\nServices will be available at:');
console.log('• Web App: http://localhost:3000');
console.log('• API: http://localhost:3001/api/health');
console.log('\n🔑 Default login credentials:');
console.log('• User: user@example.com / password123');
console.log('• Admin: admin@example.com / admin123');
console.log('\nPress Ctrl+C to stop all services\n');

// Start development servers
try {
    const child = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.log(`❌ Failed to start servers: ${error.message}`);
    });

    child.on('exit', (code) => {
        console.log(`\n🛑 Servers stopped with code ${code}`);
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping servers...');
        child.kill('SIGINT');
        process.exit(0);
    });

} catch (error) {
    console.log(`❌ Failed to start development servers: ${error.message}`);
    console.log('\nTry running manually:');
    console.log('npm run dev');
}
