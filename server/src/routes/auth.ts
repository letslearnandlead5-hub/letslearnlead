import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { PasswordReset } from '../models/PasswordReset';
import { AppError } from '../middleware/error';
import { protect, AuthRequest } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { sendPasswordResetEmail } from '../utils/emailService';

const router = Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', authLimiter, async (req: Request, res: Response, next) => {
    try {
        // Check if registration is allowed
        const { PlatformSettings } = await import('../models/PlatformSettings');
        const settings = await PlatformSettings.findOne();
        
        console.log('Registration attempt - Settings:', settings);
        console.log('User registration allowed:', settings?.userRegistration);
        
        if (settings && !settings.userRegistration) {
            console.log('Registration blocked - userRegistration is disabled');
            throw new AppError('User registration is currently disabled. Please contact support.', 403);
        }

        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        // Create welcome notification for new users
        if (user.role === 'student') {
            const { Notification } = await import('../models/Notification');
            await Notification.create({
                userId: user._id,
                title: 'Welcome to Let\'s L-earn and Lead!',
                message: 'Start your learning journey by exploring our courses and enrolling in the ones that interest you.',
                type: 'info',
            });
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, async (req: Request, res: Response, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check if user is blocked
        if (user.isBlocked) {
            throw new AppError('Your account has been blocked. Please contact support.', 403);
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new AppError('Please provide an email address', 400);
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await PasswordReset.deleteMany({ userId: user._id });

        await PasswordReset.create({
            userId: user._id,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        try {
            await sendPasswordResetEmail(email, resetToken, user.name);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordResetLimiter, async (req: Request, res: Response, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            throw new AppError('Please provide token and new password', 400);
        }

        if (password.length < 6) {
            throw new AppError('Password must be at least 6 characters', 400);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await PasswordReset.findOne({
            token: hashedToken,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!resetToken) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const user = await User.findById(resetToken.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();

        resetToken.used = true;
        await resetToken.save();

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully.',
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, phone, profilePicture, address, city, state, zipCode, grade, stream, institution, subjectInterests } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (profilePicture) user.profilePicture = profilePicture;
        if (address !== undefined) user.address = address;
        if (city !== undefined) user.city = city;
        if (state !== undefined) user.state = state;
        if (zipCode !== undefined) user.zipCode = zipCode;
        if (grade !== undefined) user.grade = grade;
        if (stream !== undefined) user.stream = stream;
        if (institution !== undefined) user.institution = institution;
        if (subjectInterests !== undefined) user.subjectInterests = subjectInterests;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePicture: user.profilePicture,
                address: user.address,
                city: user.city,
                state: user.state,
                zipCode: user.zipCode,
                grade: user.grade,
                stream: user.stream,
                institution: user.institution,
                subjectInterests: user.subjectInterests,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            throw new AppError('Please provide current and new password', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('New password must be at least 6 characters', 400);
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new AppError('Current password is incorrect', 401);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
