import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { buildServerDeviceFingerprint, getClientIp, getDeviceInfo } from '../utils/deviceFingerprint';

export interface AuthRequest extends Request {
    user?: any;
    deviceFingerprint?: string; // computed fingerprint for this request
}

// ── JWT payload shape ────────────────────────────────────────────────────────
interface AccessTokenPayload {
    id: string;
    deviceId: string; // client UUID embedded at login time
}

// ── Main protect middleware ──────────────────────────────────────────────────

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // 1. Extract access token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                success: false,
                code: 'NO_TOKEN',
                message: 'Not authorized, no token',
            });
            return;
        }

        // 2. Verify JWT signature + expiry
        let decoded: AccessTokenPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
        } catch (jwtErr: any) {
            const isExpired = jwtErr.name === 'TokenExpiredError';
            res.status(401).json({
                success: false,
                code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
                message: isExpired ? 'Access token expired' : 'Not authorized, token failed',
            });
            return;
        }

        // 3. Fetch user (include SDL fields for validation)
        const user = await User.findById(decoded.id)
            .select('+currentDeviceId +activeSessionToken +sessionStatus');

        if (!user) {
            res.status(401).json({
                success: false,
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
            return;
        }

        // 4. Check if account is blocked by admin
        if (user.isBlocked) {
            console.log(`🚫 Blocked user attempted access: ${user.email}`);
            res.status(403).json({
                success: false,
                code: 'ACCOUNT_BLOCKED',
                message: 'Your account has been disabled. Please contact support.',
            });
            return;
        }

        // 5. Check session status (e.g., admin-forced invalidation)
        if (user.sessionStatus === 'invalidated') {
            console.log(`⚠️  Invalidated session for user: ${user.email}`);
            res.status(401).json({
                success: false,
                code: 'SESSION_INVALIDATED',
                message: 'Your session has been ended. Please log in again.',
            });
            return;
        }

        // 6. Single Device Login — device fingerprint check
        //    Admins are exempt: they can use multiple devices simultaneously.
        if (user.currentDeviceId && user.role !== 'admin') {
            // Rebuild the server-side fingerprint from the current request
            const clientDeviceId = decoded.deviceId; // UUID from the JWT
            if (!clientDeviceId) {
                res.status(401).json({
                    success: false,
                    code: 'DEVICE_MISMATCH',
                    message: 'Device verification failed. Please log in again.',
                });
                return;
            }

            const currentFingerprint = buildServerDeviceFingerprint(clientDeviceId, req);

            if (currentFingerprint !== user.currentDeviceId) {
                console.log(`🔐 Device mismatch for user: ${user.email} | stored: ${user.currentDeviceId?.substring(0, 8)}... | incoming: ${currentFingerprint.substring(0, 8)}...`);
                res.status(401).json({
                    success: false,
                    code: 'DEVICE_MISMATCH',
                    message: 'Your session is active on another device. Please log in again.',
                });
                return;
            }
        }

        // 7. Attach user and fingerprint to request
        req.user = user;
        req.deviceFingerprint = decoded.deviceId;

        next();
    } catch (error) {
        console.error('❌ Auth Middleware Error:', (error as Error).message);
        res.status(401).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Not authorized',
        });
    }
};

// ── Role authorization ───────────────────────────────────────────────────────

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            console.log(`❌ Authorize: Role mismatch. Required: ${roles.join(', ')}, Actual: ${req.user.role}`);
            res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized`,
            });
            return;
        }

        next();
    };
};

// ── Admin-only shorthand ─────────────────────────────────────────────────────

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        return;
    }

    next();
};
