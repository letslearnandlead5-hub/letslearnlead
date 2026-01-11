#!/bin/bash

# 🚀 Quick Deploy Script for Let's Learn and Lead
# This script rebuilds and prepares your app for deployment

echo "🔧 Starting deployment preparation..."

# Step 1: Rebuild frontend with production env
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully"

# Step 2: Build backend
echo "🔨 Building backend..."
cd server
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

cd ..
echo "✅ Backend built successfully"

echo ""
echo "✅ Build complete! Ready to deploy to VPS"
echo ""
echo "📋 Next steps:"
echo "1. Upload 'dist' folder to your VPS"
echo "2. Upload 'server/dist' folder to your VPS"
echo "3. Upload 'server/node_modules' folder to your VPS (or run 'npm install --production' on VPS)"
echo "4. Restart your backend with: pm2 restart letslearnandlead"
echo ""
echo "Or use rsync to sync files:"
echo "rsync -avz --delete dist/ user@your-vps:/path/to/app/dist/"
echo "rsync -avz --delete server/dist/ user@your-vps:/path/to/app/server/dist/"
