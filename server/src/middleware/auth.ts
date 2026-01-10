import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.log('❌ Auth Middleware: Token valid but user not found in DB', decoded.id);
            res.status(401).json({ message: 'User not found' });
            return;
        }

        next();
    } catch (error) {
        console.error('❌ Auth Middleware Error:', (error as Error).message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            console.log('❌ Authorize: No user attached to request');
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            console.log(`❌ Authorize: Role mismatch. Required: ${roles.join(', ')}, Actual: ${req.user.role}`);
            res.status(403).json({ message: `User role ${req.user.role} is not authorized` });
            return;
        }

        next();
    };
};

// Helper middleware for admin-only routes
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Access denied. Admin only.' });
        return;
    }

    next();
};

