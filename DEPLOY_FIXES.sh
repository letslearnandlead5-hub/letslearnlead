#!/bin/bash

echo "🚀 Deploying fixes to production..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build frontend
echo -e "${BLUE}📦 Step 1: Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 2: Restart PM2
echo -e "${BLUE}🔄 Step 2: Restarting server...${NC}"
cd server
pm2 restart letslearn
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ PM2 restart failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server restarted${NC}"
echo ""

# Step 3: Check status
echo -e "${BLUE}📊 Step 3: Checking status...${NC}"
pm2 status
echo ""

# Step 4: Show recent logs
echo -e "${BLUE}📋 Step 4: Recent logs:${NC}"
pm2 logs letslearn --lines 10 --nostream
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Test English Medium filter"
echo "3. Check browser console for logs"
echo ""
echo "Monitor logs with: pm2 logs letslearn"
