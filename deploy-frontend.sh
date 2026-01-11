#!/bin/bash
# Frontend Deployment Script for VPS
# Save this on your VPS at: /var/www/deploy-frontend.sh

echo "🚀 Deploying Frontend..."

# Build directory (temp location for git repo)
BUILD_DIR="/tmp/letslearnandlead-build"
FRONTEND_DIR="/var/www/letslearnandlead-frontend"

# Clone or pull latest code
if [ -d "$BUILD_DIR" ]; then
    echo "📥 Pulling latest code..."
    cd "$BUILD_DIR"
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone git@github.com:YOUR_USERNAME/letslearnandlead.git "$BUILD_DIR"
    cd "$BUILD_DIR"
fi

if [ $? -ne 0 ]; then
    echo "❌ Git operation failed!"
    exit 1
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Copy built files to nginx directory
echo "📋 Copying files to web directory..."
sudo rm -rf "$FRONTEND_DIR"/*
sudo cp -r dist/* "$FRONTEND_DIR/"

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy files!"
    exit 1
fi

# Set correct permissions
sudo chown -R www-data:www-data "$FRONTEND_DIR"
sudo chmod -R 755 "$FRONTEND_DIR"

echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 Visit: https://letslearnandlead.com"
