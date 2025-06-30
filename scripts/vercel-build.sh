#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/database
npx prisma generate
cd ../..

# Build all packages
echo "🏗️ Building packages..."
pnpm turbo run build

echo "✅ Vercel build completed successfully!"
