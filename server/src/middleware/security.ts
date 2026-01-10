import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * Helmet middleware for comprehensive security headers
 * Replaces custom security headers with industry-standard helmet package
 */
export const helmetSecurity = helmet({
    // Strict-Transport-Security (HSTS)
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },

    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            // Allow embedding in iframes from same origin (for PDF/file viewing)
            frameAncestors: ["'self'"],
        },
    },

    // X-Frame-Options (Clickjacking protection)
    frameguard: {
        action: 'sameorigin',
    },

    // X-Content-Type-Options (MIME sniffing protection)
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
        allow: false,
    },
}) as RequestHandler;

/**
 * Middleware to redirect HTTP to HTTPS
 * Only use in production with proper SSL certificates
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
    // Check if request is not secure and redirect is enabled
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        console.log(`🔒 Redirecting HTTP to HTTPS: ${httpsUrl}`);
        return res.redirect(301, httpsUrl);
    }
    next();
};

/**
 * Get session configuration with security settings
 */
export function getSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change-this-secret-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction, // Require HTTPS in production
            httpOnly: true, // Prevent XSS access to cookies
            sameSite: 'strict' as const, // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
        name: 'sessionId', // Don't use default 'connect.sid'
    };
}

/**
 * Get cookie parser options with security settings
 */
export function getCookieParserOptions() {
    return {
        signed: true, // Use signed cookies
        httpOnly: true, // Prevent XSS access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict' as const, // CSRF protection
    };
}
