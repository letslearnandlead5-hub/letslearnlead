# 🚀 Quick Deploy Script for Let's Learn and Lead (Windows PowerShell)
# This script rebuilds and prepares your app for deployment

Write-Host "🔧 Starting deployment preparation..." -ForegroundColor Cyan

# Step 1: Rebuild frontend with production env
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Step 2: Build backend
Write-Host "`n🔨 Building backend..." -ForegroundColor Yellow
Set-Location server
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host "✅ Backend built successfully" -ForegroundColor Green

Write-Host "`n✅ Build complete! Ready to deploy to VPS" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload 'dist' folder to your VPS"
Write-Host "2. Upload 'server/dist' folder to your VPS"
Write-Host "3. Upload 'server/node_modules' folder to your VPS (or run 'npm install --production' on VPS)"
Write-Host "4. Restart your backend with: pm2 restart letslearnandlead"
Write-Host "`nOr use SCP/SFTP to upload files to your VPS"
