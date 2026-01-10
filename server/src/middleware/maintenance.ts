import { Request, Response, NextFunction } from 'express';
import { PlatformSettings } from '../models/PlatformSettings';
import { AuthRequest } from './auth';

/**
 * Middleware to check if platform is in maintenance mode
 * Allows admins to bypass maintenance mode
 */
export const checkMaintenanceMode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Skip maintenance check for certain routes
        const allowedPaths = [
            '/api/auth/login',
            '/api/auth/me',
            '/api/settings',
            '/health',
        ];

        // Allow access to allowed paths
        if (allowedPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // Get platform settings
        const settings = await PlatformSettings.findOne();

        // If maintenance mode is enabled
        if (settings && settings.maintenanceMode) {
            // Allow admins to bypass maintenance mode
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            // Block all other users
            return res.status(503).json({
                success: false,
                message: 'Platform is currently under maintenance. Please try again later.',
                maintenanceMode: true,
            });
        }

        next();
    } catch (error) {
        // If there's an error checking settings, allow access
        console.error('Error checking maintenance mode:', error);
        next();
    }
};
