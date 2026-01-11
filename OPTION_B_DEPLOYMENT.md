# 🚀 Option B Deployment - Separate Domains Setup

You're using **Option B**: Frontend and Backend on separate domains.
- **Frontend:** https://letslearnandlead.com
- **Backend API:** https://api.letslearnandlead.com

Your DNS is already configured correctly! ✅

---

## 📋 Deployment Steps

### 1️⃣ Build Your Application

**On your local machine:**

```powershell
# Build frontend
npm run build

# Build backend
cd server
npm run build
cd ..
```

---

### 2️⃣ Deploy Backend to VPS

#### Option A: Manual Upload (SCP/SFTP)

Upload these files to your VPS at `/var/www/letslearnandlead-api/`:
- `server/dist/` folder
- `server/package.json`
- `server/node_modules/` (or install on VPS)

```bash
# On VPS
cd /var/www/letslearnandlead-api
npm install --production

# Create .env file
nano .env
```

Add your production environment variables:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secret_jwt_key_here
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=https://letslearnandlead.com
```

Start with PM2:
```bash
pm2 start dist/index.js --name letslearnandlead-api
pm2 save
pm2 startup
```

#### Option B: Git Deployment (Recommended)

```bash
# On VPS
cd /var/www
git clone git@github.com:YOUR_USERNAME/letslearnandlead.git letslearnandlead-api
cd letslearnandlead-api/server

npm install --production
npm run build

# Create .env (same as above)
nano .env

# Start with PM2
pm2 start dist/index.js --name letslearnandlead-api
pm2 save
```

---

### 3️⃣ Configure Nginx for Backend (api.letslearnandlead.com)

Create nginx config:
```bash
sudo nano /etc/nginx/sites-available/api.letslearnandlead.com
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.letslearnandlead.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.letslearnandlead.com;

    # SSL certificates (will be created by certbot)
    ssl_certificate /etc/letsencrypt/live/api.letslearnandlead.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.letslearnandlead.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers (handled by Express, but nginx can add too)
    add_header Access-Control-Allow-Origin "https://letslearnandlead.com" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Proxy to Node.js API backend
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
        
        # Timeout settings for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max upload size for videos/images
    client_max_body_size 500M;
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/api.letslearnandlead.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4️⃣ Setup SSL for API Domain

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.letslearnandlead.com
```

Follow the prompts and select option 2 (Redirect HTTP to HTTPS).

---

### 5️⃣ Deploy Frontend

You have two options:

#### Option A: Nginx Serves Static Files (Recommended)

Upload your `dist/` folder to VPS:

```bash
# On VPS
sudo mkdir -p /var/www/letslearnandlead-frontend
# Upload dist folder contents here
```

Create nginx config:
```bash
sudo nano /etc/nginx/sites-available/letslearnandlead.com
```

Add this configuration:
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

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/letslearnandlead.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/letslearnandlead.com/privkey.pem;

    # Document root
    root /var/www/letslearnandlead-frontend;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static files with fallback to index.html (for React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache CSS and JS
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/letslearnandlead.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Setup SSL for main domain:
```bash
sudo certbot --nginx -d letslearnandlead.com -d www.letslearnandlead.com
```

#### Option B: Use Cloudflare Pages / Vercel / Netlify (Alternative)

You can also deploy your frontend to:
- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod`
- **Cloudflare Pages:** Connect your GitHub repo

Just make sure `.env.production` has `VITE_API_URL=https://api.letslearnandlead.com`

---

## 🔄 Update Workflow (After Initial Setup)

### Using Git (Recommended)

**For Backend:**
```bash
# Local
git push origin main

# On VPS
cd /var/www/letslearnandlead-api
git pull origin main
cd server
npm install --production
npm run build
pm2 restart letslearnandlead-api
```

**For Frontend:**
```bash
# Local
npm run build
git push origin main

# On VPS
cd /var/www/letslearnandlead-frontend
git pull origin main
npm run build
sudo cp -r dist/* /var/www/letslearnandlead-frontend/
```

Or create deployment scripts (see `deploy-backend.sh` and `deploy-frontend.sh`).

---

## ✅ Testing

### 1. Test API Health:
```bash
curl https://api.letslearnandlead.com/
# Should return: {"status":"API is running","timestamp":"..."}
```

### 2. Test API Endpoint:
```bash
curl https://api.letslearnandlead.com/api/stats/public
# Should return JSON data (not HTML)
```

### 3. Test Frontend:
Visit https://letslearnandlead.com in your browser
- ✅ No console errors
- ✅ Pages load
- ✅ API calls work

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Fix:** Update backend CORS configuration in `server/src/index.ts`:

```typescript
const allowedOrigins = [
    "https://letslearnandlead.com",
    "https://www.letslearnandlead.com"
];
```

### Issue: API returns "502 Bad Gateway"

**Fix:** Backend not running:
```bash
pm2 status
pm2 restart letslearnandlead-api
pm2 logs letslearnandlead-api
```

### Issue: Frontend shows but API calls fail

**Fix:** Check if API is accessible:
```bash
# From VPS
curl http://localhost:5000/api/stats/public

# From browser console
fetch('https://api.letslearnandlead.com/api/stats/public')
  .then(r => r.json())
  .then(console.log)
```

### Issue: SSL Certificate Errors

**Fix:** Renew certificates:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📁 Directory Structure on VPS

```
/var/www/
├── letslearnandlead-api/          # Backend (API only)
│   └── server/
│       ├── dist/
│       ├── node_modules/
│       ├── package.json
│       └── .env
│
└── letslearnandlead-frontend/     # Frontend (static files)
    ├── index.html
    ├── assets/
    ├── logo.png
    └── vite.svg
```

---

## 🎉 Summary

✅ Backend API runs on `api.letslearnandlead.com:5000` (proxied by nginx)  
✅ Frontend served by nginx from `/var/www/letslearnandlead-frontend`  
✅ Both have SSL certificates  
✅ CORS configured to allow frontend → backend communication
