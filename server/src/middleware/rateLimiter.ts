import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Applies to all API routes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
});

/**
 * Strict rate limiter for authentication routes
 * Protects against brute force attacks on login/signup
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 attempts in dev, 5 in production
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Only count failed requests for login
    skipSuccessfulRequests: true,
});

/**
 * Password reset rate limiter
 * Prevent abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Payment route rate limiter
 * Protect payment endpoints
 */
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 payment requests per 15 minutes
    message: {
        success: false,
        message: 'Too many payment requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Admin route rate limiter
 * Higher limits for admin operations but still protected
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
