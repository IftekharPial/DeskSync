#!/bin/bash

# DailySync Production Setup Script
# This script helps set up the DailySync application for production

echo "🚀 DailySync Production Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the DailySync root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Running type checks..."
pnpm run type-check

echo "🧹 Running linting..."
pnpm run lint

echo "🏗️  Building the application..."
pnpm run build

echo "✅ Build completed successfully!"

echo ""
echo "📋 Next Steps:"
echo "1. Set up your environment variables:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   - NEXTAUTH_URL (your production domain)"
echo "   - SLACK_WEBHOOK_URL (optional, for notifications)"
echo ""
echo "2. Run database migration:"
echo "   pnpm --filter @dailysync/database exec prisma db push"
echo ""
echo "3. Generate Prisma client:"
echo "   pnpm --filter @dailysync/database exec prisma generate"
echo ""
echo "4. Seed platform data:"
echo "   node packages/database/prisma/seed-platforms.ts"
echo ""
echo "5. Test the application:"
echo "   node test-webhook-receive.js"
echo ""
echo "6. Deploy to your hosting platform (Vercel recommended)"
echo ""
echo "📚 For detailed instructions, see PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Setup completed! Your DailySync application is ready for production."
