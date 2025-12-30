#!/bin/bash

# WACRM Development Setup Script
# This script sets up the development environment for WACRM

set -e

echo "🚀 Setting up WACRM development environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if required tools are installed
if ! command_exists "docker"; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

if ! command_exists "pnpm"; then
    echo "❌ pnpm is required but not installed. Please install pnpm first."
    exit 1
fi

echo "✅ Required tools are available"

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. You may want to review and update the values."
else
    echo "✅ .env file already exists"
fi

# Create symlink for Next.js to access environment variables
echo "🔗 Creating .env.local symlink for Next.js..."
cd apps/web && ln -sf ../../.env .env.local && cd ../..

# Start Docker containers
echo "🐳 Starting PostgreSQL and Redis containers..."
docker compose -f infra/docker-compose.yml up -d

# Wait a moment for containers to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install TypeScript types for better development experience
echo "🔧 Installing TypeScript type definitions..."
pnpm add -w -D @types/bcryptjs @types/node

# Set up database
echo "🗄️ Setting up database..."

# Export environment variables
export DATABASE_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm?schema=public"
export DIRECT_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/db && pnpm prisma generate
cd ../..

# Run migrations
echo "🔄 Running database migrations..."
cd packages/db && pnpm prisma migrate dev --name init
cd ../..

# Seed database
echo "🌱 Seeding database..."
pnpm seed

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start development servers, run:"
echo "  pnpm web      # Start the Next.js web app (http://localhost:3000)"
echo "  pnpm worker   # Start the background worker"
echo ""
echo "Default login credentials:"
echo "  Email: owner@pixelcode.dev"
echo "  Password: admin123"
echo ""