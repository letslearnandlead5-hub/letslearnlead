# Production Deployment Fix

## Issue
The production build is making API calls without the `/api` prefix, resulting in 404 errors.

## Root Cause
The old build had `VITE_API_URL=http://localhost:5000/api` which caused double `/api/api/` paths.
The code has been fixed, but you need to rebuild and redeploy.

## Solution Steps

### 1. Verify Environment Variables

**Local Development (.env)**
```
VITE_API_URL=http://localhost:5000
```

**Production (.env.production)**
```
VITE_API_URL=https://api.letslearnandlead.com
VITE_RAZORPAY_KEY_ID=your_production_razorpay_key
```

### 2. Clean and Rebuild

```bash
# Remove old build
rm -rf dist

# Clean node modules cache (optional but recommended)
npm cache clean --force

# Rebuild for production
npm run build
```

### 3. Verify Build Output

After building, check that the environment variable is correctly embedded:

```bash
# On Linux/Mac
grep -r "api.letslearnandlead.com" dist/

# On Windows (PowerShell)
Select-String -Path "dist\assets\*.js" -Pattern "api.letslearnandlead.com"
```

You should see: `https://api.letslearnandlead.com/api` in the compiled JavaScript.

### 4. Deploy New Build

Upload the new `dist` folder to your production server.

### 5. Verify in Browser

After deployment:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Open DevTools Console
4. Check Network tab - API calls should now go to:
   - ✅ `https://api.letslearnandlead.com/api/settings`
   - ✅ `https://api.letslearnandlead.com/api/courses`
   - ✅ `https://api.letslearnandlead.com/api/stats/public`

## Backend Verification

Make sure your backend server is running and accessible:

```bash
# Test from command line
curl https://api.letslearnandlead.com/api/stats/public

# Should return JSON with success: true
```

## CORS Configuration

Your backend (`server/src/index.ts`) allows these origins:
- `https://letslearnandlead.com`
- `https://www.letslearnandlead.com`

Make sure your frontend is deployed to one of these domains.

## Common Issues

### Issue: Still getting 404s after rebuild
**Solution**: Clear CDN cache if using one (Cloudflare, etc.)

### Issue: CORS errors instead of 404s
**Solution**: Check that your frontend domain matches the allowed origins in `server/src/index.ts`

### Issue: Mixed content warnings
**Solution**: Ensure both frontend and backend use HTTPS

## Files Changed
- ✅ `src/services/api.ts` - Fixed baseURL configuration
- ✅ `.env` - Removed `/api` suffix
- ✅ `.env.production` - Set correct production URL
- ✅ `.env.production.example` - Updated documentation
