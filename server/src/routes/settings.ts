import { Router, Response } from 'express';
import { PlatformSettings } from '../models/PlatformSettings';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/settings
// @desc    Get platform settings
// @access  Public (for checking maintenance mode, registration status)
router.get('/', async (req: AuthRequest, res: Response, next) => {
    try {
        let settings = await PlatformSettings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await PlatformSettings.create({
                emailNotifications: true,
                maintenanceMode: false,
                userRegistration: true,
            });
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/settings
// @desc    Update platform settings
// @access  Private (Admin only)
router.put('/', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { emailNotifications, maintenanceMode, userRegistration } = req.body;

        let settings = await PlatformSettings.findOne();

        if (!settings) {
            // Create if doesn't exist
            settings = await PlatformSettings.create({
                emailNotifications: emailNotifications ?? true,
                maintenanceMode: maintenanceMode ?? false,
                userRegistration: userRegistration ?? true,
            });
        } else {
            // Update existing settings
            if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
            if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
            if (userRegistration !== undefined) settings.userRegistration = userRegistration;
            
            await settings.save();
        }

        res.status(200).json({
            success: true,
            data: settings,
            message: 'Settings updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
