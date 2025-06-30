#!/bin/bash

# DailySync Testing Setup Script
# This script helps set up the testing environment

set -e

echo "🚀 DailySync Testing Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    echo "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_status "Node.js version is compatible (18+)"
        else
            print_error "Node.js version must be 18 or higher. Current: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if pnpm is installed
check_pnpm() {
    echo "Checking pnpm installation..."
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        print_status "pnpm is installed: $PNPM_VERSION"
    else
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
        print_status "pnpm installed successfully"
    fi
}

# Check if PostgreSQL is running
check_postgresql() {
    echo "Checking PostgreSQL..."
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL client is available"
        
        # Try to connect to default database
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            print_status "PostgreSQL server is running"
        else
            print_warning "PostgreSQL server is not running or not accessible"
            echo "Please start PostgreSQL server before continuing"
        fi
    else
        print_warning "PostgreSQL client not found. Please install PostgreSQL 15+"
    fi
}

# Check if Redis is running
check_redis() {
    echo "Checking Redis..."
    if command -v redis-cli &> /dev/null; then
        print_status "Redis client is available"
        
        # Try to ping Redis server
        if redis-cli ping &> /dev/null; then
            print_status "Redis server is running"
        else
            print_warning "Redis server is not running or not accessible"
            echo "Please start Redis server before continuing"
        fi
    else
        print_warning "Redis client not found. Please install Redis 7+"
    fi
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    if [ -f "package.json" ]; then
        pnpm install
        print_status "Dependencies installed successfully"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    echo "Setting up environment file..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Environment file created from .env.example"
            print_warning "Please edit .env file with your local configuration"
        else
            print_warning ".env.example not found. Creating basic .env file..."
            cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dailysync_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-for-development"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API Configuration
API_PORT=3001
WEBHOOK_API_KEY="dev-webhook-api-key"

# Development
NODE_ENV="development"
EOF
            print_status "Basic .env file created"
            print_warning "Please edit .env file with your actual database credentials"
        fi
    else
        print_status "Environment file already exists"
    fi
}

# Setup database
setup_database() {
    echo "Setting up database..."
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    pnpm db:generate
    print_status "Prisma client generated"
    
    # Run migrations
    echo "Running database migrations..."
    if pnpm db:migrate; then
        print_status "Database migrations completed"
    else
        print_error "Database migrations failed. Please check your database connection"
        return 1
    fi
    
    # Seed database
    echo "Seeding database with test data..."
    if pnpm db:seed; then
        print_status "Database seeded successfully"
    else
        print_warning "Database seeding failed. You may need to seed manually"
    fi
}

# Create test scripts
create_test_scripts() {
    echo "Creating test scripts..."
    
    # Make test scripts executable
    if [ -f "scripts/test-api.js" ]; then
        chmod +x scripts/test-api.js
        print_status "API test script is ready"
    fi
    
    # Create quick test runner
    cat > test-quick.sh << 'EOF'
#!/bin/bash
echo "🧪 Running Quick API Tests..."
node scripts/test-api.js
EOF
    chmod +x test-quick.sh
    print_status "Quick test runner created (./test-quick.sh)"
}

# Main setup function
main() {
    echo "Starting DailySync testing environment setup..."
    echo
    
    check_nodejs
    echo
    
    check_pnpm
    echo
    
    check_postgresql
    echo
    
    check_redis
    echo
    
    install_dependencies
    echo
    
    setup_environment
    echo
    
    setup_database
    echo
    
    create_test_scripts
    echo
    
    print_status "Setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Edit .env file with your database credentials"
    echo "2. Start the services: pnpm dev"
    echo "3. Run tests: ./test-quick.sh"
    echo "4. Open browser: http://localhost:3000"
    echo
    echo "For comprehensive testing, follow the TESTING_GUIDE.md"
}

# Run main function
main
