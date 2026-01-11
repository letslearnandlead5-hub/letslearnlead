# 🚀 VPS Deployment Guide - Let's Learn and Lead

## Overview
Your app has two deployment options:

### **Option A: Same Server (Recommended for single VPS)**
- Frontend + Backend run on the same server
- Simpler setup, single domain needed
- Backend serves the built frontend

### **Option B: Separate Servers/Domains**
- Frontend on `letslearnandlead.com`
- Backend on `api.letslearnandlead.com`
- Requires DNS configuration for both domains

---

## 🎯 Current Issue

Based on your screenshot, you're getting **"Unexpected token '<'"** errors. This means:
- Your frontend is making API calls to `https://api.letslearnandlead.com`
- But that domain isn't responding with JSON (returning HTML error pages instead)

---

## ✅ Solution 1: Single Server Setup (EASIEST)

### Step 1: Update Frontend Environment

Update `.env.production`:
```env
# Use the same domain for API - backend will handle /api routes
VITE_API_URL=https://letslearnandlead.com
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

### Step 2: Rebuild Frontend
```bash
npm run build
```

### Step 3: Deploy Server Code
Your server is already configured to serve the frontend! Just make sure:

1. Upload the built `dist/` folder to your VPS
2. Upload the `server/` folder to your VPS
3. Compile TypeScript on the server:
```bash
cd server
npm install
npm run build
```

4. Start the server with PM2:
```bash
pm2 start dist/index.js --name letslearnandlead
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/letslearnandlead.com`:
```nginx
server {
    listen 80;
    server_name letslearnandlead.com www.letslearnandlead.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name letslearnandlead.com www.letslearnandlead.com;

    # SSL certificates (using Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/letslearnandlead.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/letslearnandlead.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js backend (which also serves the frontend)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase max upload size for videos/images
    client_max_body_size 500M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/letslearnandlead.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d letslearnandlead.com -d www.letslearnandlead.com
```

---

## ✅ Solution 2: Separate Domains (Advanced)

### If you want API on a separate subdomain:

#### Step 1: Keep `.env.production` as is:
```env
VITE_API_URL=https://api.letslearnandlead.com
```

#### Step 2: Configure DNS
Add an A record for `api.letslearnandlead.com` pointing to your VPS IP.

#### Step 3: Update Server Code

Modify `server/src/index.ts` - **REMOVE** the frontend serving code I just added:
```typescript
// Remove these lines:
app.use(express.static(path.join(__dirname, '../../dist')));
app.get('*', (req, res, next) => { ... });

// Replace with a simple health check:
app.get("/", (req, res) => {
    res.json({ status: "API is running" });
});
```

#### Step 4: Create Two Nginx Configs

**For API** (`/etc/nginx/sites-available/api.letslearnandlead.com`):
```nginx
server {
    listen 80;
    server_name api.letslearnandlead.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.letslearnandlead.com;

    ssl_certificate /etc/letsencrypt/live/api.letslearnandlead.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.letslearnandlead.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 500M;
}
```

**For Frontend** (`/etc/nginx/sites-available/letslearnandlead.com`):
```nginx
server {
    listen 80;
    server_name letslearnandlead.com www.letslearnandlead.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name letslearnandlead.com www.letslearnandlead.com;

    ssl_certificate /etc/letsencrypt/live/letslearnandlead.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/letslearnandlead.com/privkey.pem;

    root /var/www/letslearnandlead/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Step 5: Deploy Frontend Files
```bash
# On your VPS
sudo mkdir -p /var/www/letslearnandlead
sudo cp -r /path/to/dist/* /var/www/letslearnandlead/dist/
```

---

## 🔍 Debugging Steps

### 1. Check if backend is running:
```bash
pm2 status
pm2 logs letslearnandlead
```

### 2. Test API directly:
```bash
curl http://localhost:5000/api/stats/public
```

### 3. Check Nginx configuration:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### 4. View Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 5. Check firewall:
```bash
sudo ufw status
# Make sure ports 80 and 443 are allowed
sudo ufw allow 80
sudo ufw allow 443
```

---

## 📝 Quick Checklist

- [ ] Frontend built with correct `VITE_API_URL`
- [ ] Backend compiled (`npm run build` in server/)
- [ ] Backend running on port 5000 (check with `pm2 status`)
- [ ] Nginx configuration created and tested
- [ ] SSL certificates installed
- [ ] DNS pointing to VPS IP
- [ ] Firewall allows ports 80 and 443

---

## 🆘 Common Issues

### Issue: "CORS not allowed" errors
**Fix:** Make sure your `.env.production` on the server has the correct frontend URL:
```env
FRONTEND_URL=https://letslearnandlead.com
```

### Issue: API returns HTML instead of JSON
**Fix:** Check that:
1. Backend is actually running (`pm2 status`)
2. Nginx is proxying correctly to `localhost:5000`
3. API routes start with `/api`

### Issue: 502 Bad Gateway
**Fix:** Backend isn't running or port mismatch
```bash
pm2 restart letslearnandlead
```

---

**💡 Recommendation:** Use **Solution 1** (single server) - it's simpler and you've already made the code changes!
