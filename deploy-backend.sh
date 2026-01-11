#!/bin/bash
# Backend Deployment Script for VPS
# Save this on your VPS at: /var/www/letslearnandlead-api/deploy.sh

echo "🚀 Deploying Backend API..."

# Navigate to backend directory
cd /var/www/letslearnandlead-api

# Pull latest code from Git
echo "📥 Pulling latest code..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

# Build backend
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Restart PM2
echo "🔄 Restarting API server..."
pm2 restart letslearnandlead-api

echo ""
echo "✅ Backend deployment complete!"
echo ""
pm2 status
