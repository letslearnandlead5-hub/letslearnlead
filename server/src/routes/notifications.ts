import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { limit = 20, unreadOnly } = req.query;

        const filter: any = { userId: req.user._id };
        if (unreadOnly === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        const unreadCount = await Notification.countDocuments({
            userId: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        // Check if notification belongs to user
        if (notification.userId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized', 403);
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        // Check if notification belongs to user
        if (notification.userId.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized', 403);
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/notifications/create
// @desc    Create a notification (for system/admin use)
// @access  Private (Admin)
router.post('/create', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { title, message, type, recipientType, userId } = req.body;

        if (recipientType === 'all') {
            // Get all users
            const User = require('../models/User').User;
            const users = await User.find({}, '_id');
            
            // Create notification for each user
            const notifications = await Promise.all(
                users.map((user: any) =>
                    Notification.create({
                        userId: user._id,
                        title,
                        message,
                        type: type || 'info',
                    })
                )
            );

            res.status(201).json({
                success: true,
                message: `Notification sent to ${notifications.length} users`,
                data: notifications,
            });
        } else {
            // Create notification for specific user
            const notification = await Notification.create({
                userId,
                title,
                message,
                type: type || 'info',
            });

            res.status(201).json({
                success: true,
                data: notification,
            });
        }
    } catch (error) {
        next(error);
    }
});

export default router;
