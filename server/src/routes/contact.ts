import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/error';

const router = Router();

// @route   POST /api/contact
// @desc    Submit contact form message
// @access  Public
router.post('/', async (req: Request, res: Response, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            throw new AppError('All fields are required', 400);
        }

        // Create notification for all admins
        const { Notification } = await import('../models/Notification');
        const adminUsers = await User.find({ role: 'admin' });

        const notificationPromises = adminUsers.map(admin =>
            Notification.create({
                userId: admin._id,
                title: '📨 New Contact Form Message',
                message: `${name} (${email}) - Subject: "${subject}"`,
                type: 'info',
                link: '/admin/students', // You can create a dedicated contact messages page later
            })
        );

        await Promise.all(notificationPromises);
        console.log(`📬 Created contact form notifications for ${adminUsers.length} admin(s)`);
        console.log(`📧 Contact from: ${name} <${email}> - Subject: ${subject}`);

        res.status(200).json({
            success: true,
            message: 'Message received! We\'ll get back to you soon.',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
