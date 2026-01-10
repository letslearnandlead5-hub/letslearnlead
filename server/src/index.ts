import express, { Application } from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/error';
import { helmetSecurity, httpsRedirect, getSessionConfig, getCookieParserOptions } from './middleware/security';
import { apiLimiter, paymentLimiter, adminLimiter } from './middleware/rateLimiter';
import { generateSelfSignedCertificate, readSSLCertificates } from './utils/ssl-cert-generator';
import { checkMaintenanceMode } from './middleware/maintenance';

// Import routes
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import noteRoutes from './routes/notes';
import shopRoutes from './routes/shop';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import newsletterRoutes from './routes/newsletter';
import paymentRoutes from './routes/payment';
import progressRoutes from './routes/progress';
import invoiceRoutes from './routes/invoice';
import enrollmentRoutes from './routes/enrollment';
import doubtRoutes from './routes/doubts';
import quizRoutes from './routes/quizzes';
import settingsRoutes from './routes/settings';
import statsRoutes from './routes/stats';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to database
connectDB();

// Security Configuration
const isProduction = process.env.NODE_ENV === 'production';

// Helmet middleware (comprehensive security headers)
app.use(helmetSecurity);

// Cookie parser with secure settings
const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'change-this-secret';
app.use(cookieParser(cookieSecret));

// Session middleware with secure cookies
app.use(session(getSessionConfig()));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with CORS headers
app.use('/invoices', express.static(path.join(__dirname, '../invoices')));

// Serve notes files with permissive headers for iframe viewing
app.use('/notes', (req, res, next) => {
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5173 https://localhost:5173");
    next();
});
app.use('/notes', express.static(path.join(__dirname, '../public/notes')));

// Add CORS headers for video files to allow cross-origin access
app.use('/videos', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});
app.use('/videos', express.static(path.join(__dirname, '../public/videos')));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply maintenance mode check to all routes (except auth and settings)
app.use(checkMaintenanceMode);

// Routes (auth routes have their own rate limiters)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);


// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        environment: process.env.NODE_ENV || 'development',
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS !== 'false'; // Default to true
const FORCE_HTTPS_REDIRECT = process.env.FORCE_HTTPS_REDIRECT === 'true' || isProduction; // Default to true in production
const DISABLE_HTTP = process.env.DISABLE_HTTP === 'true'; // Completely disable HTTP server

// Start servers
if (ENABLE_HTTPS) {
    try {
        // Generate or load SSL certificates
        let certPath = process.env.SSL_CERT_PATH;
        let keyPath = process.env.SSL_KEY_PATH;

        if (!certPath || !keyPath) {
            // Generate self-signed certificates for development
            const generated = generateSelfSignedCertificate();
            certPath = generated.certPath;
            keyPath = generated.keyPath;
        }

        const { cert, key } = readSSLCertificates(certPath, keyPath);

        // Create HTTPS server
        const httpsServer = https.createServer({ key, cert }, app);

        httpsServer.listen(HTTPS_PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🚀 Server Started Successfully');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`🔒 HTTPS Server:  https://localhost:${HTTPS_PORT}`);
            console.log(`📝 Environment:   ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL:  ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`🛡️  Helmet:        ✅ Enabled`);
            console.log(`🍪 Secure Cookies: ✅ Enabled`);

            if (FORCE_HTTPS_REDIRECT && !DISABLE_HTTP) {
                console.log(`🔄 HTTP Redirect: http://localhost:${PORT} → https://localhost:${HTTPS_PORT}`);
            } else if (DISABLE_HTTP) {
                console.log(`🔓 HTTP Server:   ❌ Disabled (HTTPS only)`);
            }

            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
        });

        // Handle HTTP server based on configuration
        if (DISABLE_HTTP) {
            // Don't start HTTP server at all in production if disabled
            console.log('ℹ️  HTTP server disabled. HTTPS only mode.');
        } else if (FORCE_HTTPS_REDIRECT) {
            // Create HTTP server that only redirects to HTTPS
            const httpApp = express();
            httpApp.use(httpsRedirect);

            const httpServer = http.createServer(httpApp);
            httpServer.listen(PORT, () => {
                console.log(`🔓 HTTP Redirect Server running on port ${PORT}`);
            });
        } else {
            // Run HTTP server alongside HTTPS for development convenience
            const httpServer = http.createServer(app);
            httpServer.listen(PORT, () => {
                console.log(`🔓 HTTP Server also running on port ${PORT} (for development)`);
            });
        }
    } catch (error) {
        console.error('❌ Failed to start HTTPS server:', error);
        console.log('');
        console.log('Falling back to HTTP only...');

        // Fallback to HTTP only
        app.listen(PORT, () => {
            console.log(`🚀 Server running on HTTP port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        });
    }
} else {
    // HTTP only mode (if HTTPS is explicitly disabled)
    app.listen(PORT, () => {
        console.log(`🚀 Server running on HTTP port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        console.log('⚠️  HTTPS is disabled. Enable it by setting ENABLE_HTTPS=true');
    });
}

export default app;

