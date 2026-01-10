import express, { Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter';

const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        // Validate email presence
        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required',
            });
            return;
        }

        // Check if email already exists
        const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

        if (existingSubscription) {
            if (existingSubscription.isActive) {
                res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter',
                });
                return;
            } else {
                // Reactivate subscription
                existingSubscription.isActive = true;
                existingSubscription.subscribedAt = new Date();
                await existingSubscription.save();

                res.status(200).json({
                    success: true,
                    message: 'Successfully resubscribed to newsletter!',
                });
                return;
            }
        }

        // Create new subscription
        const newsletter = await Newsletter.create({ email });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter!',
            data: {
                email: newsletter.email,
                subscribedAt: newsletter.subscribedAt,
            },
        });
    } catch (error: any) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'This email is already subscribed to our newsletter',
            });
            return;
        }

        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while subscribing to the newsletter',
        });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email is required',
            });
            return;
        }

        const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

        if (!subscription) {
            res.status(404).json({
                success: false,
                message: 'Email not found in our newsletter list',
            });
            return;
        }

        subscription.isActive = false;
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter',
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while unsubscribing from the newsletter',
        });
    }
});

export default router;
