import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';

// ── Access Token ─────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token (default 15 m).
 * Payload: { id, deviceId } — the deviceId is bound to this token so that
 * the auth middleware can detect device mismatches without a DB lookup on
 * every single request.
 */
export const signAccessToken = (userId: string, deviceId: string): string => {
    return jwt.sign(
        { id: userId, deviceId },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') } as jwt.SignOptions
    );
};

// ── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-random opaque refresh token (64 hex chars).
 */
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * One-way SHA-256 hash a refresh token before storing in DB.
 * We never store the raw token — only its hash.
 */
export const hashRefreshToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ── Cookie helpers ───────────────────────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = 'refreshToken';

/** Write the refresh token as an HTTP-only secure cookie. */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
    const expiryDays = parseInt(
        (process.env.JWT_REFRESH_EXPIRES_IN || '7d').replace('d', ''),
        10
    );

    res.cookie(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: expiryDays * 24 * 60 * 60 * 1000, // ms
        path: '/',
    });
};

/** Clear the refresh token cookie on logout. */
export const clearRefreshTokenCookie = (res: Response): void => {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
    });
};

/** Extract the refresh token from the incoming request cookie. */
export const getRefreshTokenFromCookie = (
    cookies: Record<string, string | undefined>
): string | undefined => {
    return cookies[REFRESH_TOKEN_COOKIE];
};
