#!/bin/bash
# ============================================
# Wallet System - One-Command Setup
# ============================================
set -e

echo "💰 Wallet System Setup"
echo "======================"
echo ""

# -------------------------------------------
# Option 1: Docker (Recommended)
# -------------------------------------------
if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
  echo "🐳 Docker detected. Starting full stack..."
  docker compose up -d --build
  echo ""
  echo "✅ App running at http://localhost:3000"
  echo "   Database migrations and seeding handled automatically."
  echo ""
  echo "📋 To get user/asset IDs:"
  echo "   docker compose exec app node scripts/get-ids.js"
  exit 0
fi

# -------------------------------------------
# Option 2: Manual Setup (Node.js + Docker for DB)
# -------------------------------------------
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🐘 Starting PostgreSQL..."
if command -v docker &> /dev/null; then
  docker compose up -d postgres
  echo "⏳ Waiting for database to be ready..."
  sleep 5
else
  echo "⚠️  Docker not found. Please start PostgreSQL manually."
  echo "   Set DATABASE_URL in .env file."
  echo ""
fi

echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "🔄 Generating Prisma client..."
npx prisma generate

echo ""
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "📋 Database IDs:"
node scripts/get-ids.js

echo ""
echo "✅ Setup complete! Run 'npm run dev' to start the server."
echo "   Server will be at http://localhost:3000"
