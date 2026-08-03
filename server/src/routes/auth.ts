import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';
import { User } from '../models/User';
import { PasswordReset } from '../models/PasswordReset';
import { AppError } from '../middleware/error';
import { protect, AuthRequest } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { sendPasswordResetEmail } from '../utils/emailService';
import { validate } from '../middleware/validate';
import {
    signupSchema,
    loginSchema,
    changePasswordSchema,
    resetPasswordSchema,
    forgotPasswordSchema,
    updateProfileSchema,
} from '../validators/schemas';
import {
    signAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    setRefreshTokenCookie,
    clearRefreshTokenCookie,
    getRefreshTokenFromCookie,
} from '../utils/tokenService';
import {
    buildServerDeviceFingerprint,
    getClientIp,
    getDeviceInfo,
} from '../utils/deviceFingerprint';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_ADMIN_SESSIONS = 10; // max concurrent admin devices

/**
 * Bind a new device session to a user document.
 *
 * - ADMINS: upsert a slot in adminSessions[] (one per device fingerprint).
 *   This is what fixes the two-laptop logout bug — each device keeps its own
 *   independent refresh token so a second login never kills the first.
 * - STUDENTS/TEACHERS: single-slot behavior unchanged (activeSessionToken).
 *
 * Returns the raw (unhashed) refresh token for sending to the client.
 */
const bindDeviceSession = async (
    user: any,
    deviceFingerprint: string,
    req: Request
): Promise<string> => {
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashRefreshToken(rawRefreshToken);

    if (user.role === 'admin') {
        // Ensure adminSessions is loaded (it has select:false by default)
        if (!user.adminSessions) user.adminSessions = [];

        // Remove any stale slot for this same fingerprint (re-login from same device)
        user.adminSessions = user.adminSessions.filter(
            (s: any) => s.deviceFingerprint !== deviceFingerprint
        );

        // Enforce cap: evict the oldest slot if at limit
        if (user.adminSessions.length >= MAX_ADMIN_SESSIONS) {
            user.adminSessions.sort((a: any, b: any) =>
                new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime()
            );
            user.adminSessions.shift(); // remove oldest
        }

        // Add new session slot for this device
        user.adminSessions.push({
            deviceFingerprint,
            tokenHash: hashedRefreshToken,
            lastUsedAt: new Date(),
        });

        // Also update convenience fields (not used for auth, just informational)
        user.lastLoginAt = new Date();
        user.deviceInfo  = getDeviceInfo(req);
        user.ipAddress   = getClientIp(req);
        user.sessionStatus = 'active';
    } else {
        // Students/teachers: existing single-slot behavior
        user.currentDeviceId    = deviceFingerprint;
        user.activeSessionToken = hashedRefreshToken;
        user.lastLoginAt        = new Date();
        user.deviceInfo         = getDeviceInfo(req);
        user.ipAddress          = getClientIp(req);
        user.sessionStatus      = 'active';
    }

    await user.save();
    return rawRefreshToken;
};

/**
 * Clear session fields from a user (called on logout or invalidation).
 * For admins: removes only the slot matching deviceFingerprint (logs out one device).
 * Pass deviceFingerprint=undefined to clear ALL admin slots (force-logout all).
 */
const clearDeviceSession = async (user: any, deviceFingerprint?: string): Promise<void> => {
    if (user.role === 'admin') {
        if (deviceFingerprint && user.adminSessions?.length) {
            // Log out only this device
            user.adminSessions = user.adminSessions.filter(
                (s: any) => s.deviceFingerprint !== deviceFingerprint
            );
        } else {
            // Log out all devices
            user.adminSessions = [];
        }
        if (!user.adminSessions?.length) user.sessionStatus = 'invalidated';
    } else {
        user.currentDeviceId    = undefined;
        user.activeSessionToken = undefined;
        user.sessionStatus      = 'invalidated';
    }
    await user.save();
};

// ── @route   POST /api/auth/signup ───────────────────────────────────────────
// @desc    Register a new user
// @access  Public
router.post('/signup', authLimiter, validate(signupSchema), async (req: Request, res: Response, next) => {
    try {
        // Check if registration is allowed
        const { PlatformSettings } = await import('../models/PlatformSettings');
        const settings = await PlatformSettings.findOne();

        if (settings && !settings.userRegistration) {
            throw new AppError('User registration is currently disabled. Please contact support.', 403);
        }

        const { name, email, password, role, deviceId } = req.body;

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

        // Bind device session
        const clientDeviceId = deviceId || crypto.randomUUID();
        const fingerprint = buildServerDeviceFingerprint(clientDeviceId, req);
        const rawRefreshToken = await bindDeviceSession(user, fingerprint, req);

        // Sign access token (embeds the client UUID so middleware can recompute fingerprint)
        const accessToken = signAccessToken(String(user._id), clientDeviceId);

        // Set refresh token as HTTP-only cookie
        setRefreshTokenCookie(res, rawRefreshToken);

        // Create welcome notification for new users
        if (user.role === 'student') {
            const { Notification } = await import('../models/Notification');
            await Notification.create({
                userId: user._id,
                title: "Welcome to Let's L-earn and Lead!",
                message: 'Start your learning journey by exploring our courses and enrolling in the ones that interest you.',
                type: 'info',
            });

            // Notify all admins about new student signup
            try {
                const adminUsers = await User.find({ role: 'admin' });
                const notificationPromises = adminUsers.map(admin =>
                    Notification.create({
                        userId: admin._id,
                        title: '👤 New Student Signup',
                        message: `${user.name} (${user.email}) just signed up on the platform.`,
                        type: 'info',
                        link: '/admin/students',
                    })
                );
                await Promise.all(notificationPromises);
                console.log(`📬 Created signup notifications for ${adminUsers.length} admin(s)`);
            } catch (notificationError) {
                console.error('Failed to create admin signup notification:', notificationError);
            }
        }

        res.status(201).json({
            success: true,
            token: accessToken,
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

// ── @route   POST /api/auth/login ────────────────────────────────────────────
// @desc    Login user — enforces Single Device Login (block mode)
// @access  Public
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response, next) => {
    try {
        const { email, password, deviceId, forceLogout } = req.body;

        // Debug log — remove after fixing
        console.log(`🔑 Login attempt: ${email} | deviceId: ${deviceId?.substring(0, 8)}... | forceLogout: ${forceLogout}`);

        // 1. Check if user exists
        const user = await User.findOne({ email })
            .select('+password +currentDeviceId +activeSessionToken +sessionStatus +adminSessions');
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // 2. Check if blocked
        if (user.isBlocked) {
            throw new AppError('Your account has been blocked. Please contact support.', 403);
        }

        // 3. Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        // 4. Build fingerprint for the new device
        const clientDeviceId = deviceId || crypto.randomUUID();
        const newFingerprint = buildServerDeviceFingerprint(clientDeviceId, req);

        // Debug: log SDL check values
        console.log(`🔐 SDL check: storedDevice=${user.currentDeviceId?.substring(0,8)}... | newDevice=${newFingerprint.substring(0,8)}... | sessionStatus=${user.sessionStatus} | forceLogout=${forceLogout} | match=${user.currentDeviceId === newFingerprint}`);

        // 5. ── SINGLE DEVICE LOGIN ENFORCEMENT ──────────────────────────────
        //    Admins are exempt — they can log in from multiple devices freely.
        //    Only block non-admin users who have an active session on a DIFFERENT device.
        if (
            user.role !== 'admin' &&
            user.currentDeviceId &&
            user.sessionStatus === 'active' &&
            user.currentDeviceId !== newFingerprint &&
            !forceLogout
        ) {
            const sdlMode = process.env.SINGLE_DEVICE_MODE || 'block';

            if (sdlMode === 'block') {
                // OPTION A (user's choice): Reject the new login
                console.log(`🔐 SDL Block: ${email} tried to login from a second device`);
                res.status(409).json({
                    success: false,
                    code: 'ACCOUNT_ACTIVE_ELSEWHERE',
                    message: 'This account is already active on another device. Please log out from that device first.',
                });
                return;
            }
            // If 'force-logout' mode were chosen, we'd fall through and overwrite.
            // Since mode is 'block', we never reach here.
        }
        // ───────────────────────────────────────────────────────────────────

        // 6. Bind new device session (overwrites any stale session)
        const rawRefreshToken = await bindDeviceSession(user, newFingerprint, req);

        // 7. Sign access token
        const accessToken = signAccessToken(String(user._id), clientDeviceId);

        // 8. Set refresh token cookie
        setRefreshTokenCookie(res, rawRefreshToken);

        console.log(`✅ Login: ${email} on device ${newFingerprint.substring(0, 8)}...`);

        res.status(200).json({
            success: true,
            token: accessToken,
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

// ── @route   POST /api/auth/logout ───────────────────────────────────────────────
// @desc    Logout user — removes only THIS device's session slot
// @access  Private
router.post('/logout', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('+currentDeviceId +activeSessionToken +adminSessions');

        if (user) {
            // For admins: pass the device fingerprint so only THIS device is logged out.
            // Other admin devices remain active (up to 10 concurrent).
            // For students/teachers: clears the single active session as before.
            const thisDeviceFingerprint = req.deviceFingerprint; // set by protect middleware
            await clearDeviceSession(user, thisDeviceFingerprint);
            console.log(`👋 Logout: ${user.email} | device: ${thisDeviceFingerprint?.substring(0, 8)}...`);
        }

        clearRefreshTokenCookie(res);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ── @route   POST /api/auth/refresh ──────────────────────────────────────────
// @desc    Refresh access token using HTTP-only refresh token cookie
// @access  Public (uses cookie instead of Authorization header)
router.post('/refresh', async (req: Request, res: Response, next) => {
    try {
        const rawRefreshToken = getRefreshTokenFromCookie(req.cookies);

        if (!rawRefreshToken) {
            res.status(401).json({
                success: false,
                code: 'NO_REFRESH_TOKEN',
                message: 'No refresh token provided',
            });
            return;
        }

        // Hash the incoming token
        const hashedToken = hashRefreshToken(rawRefreshToken);

        // ── Admin path: look up by adminSessions slot ───────────────────────────────
        // Try to find an admin whose adminSessions[] contains a matching tokenHash.
        let user = await User.findOne(
            { 'adminSessions.tokenHash': hashedToken, role: 'admin' }
        ).select('+currentDeviceId +activeSessionToken +sessionStatus +adminSessions');

        let isAdminSession = !!user;
        let adminSessionSlot: any = null;

        if (user) {
            // Identify which slot matched
            adminSessionSlot = user.adminSessions?.find((s: any) => s.tokenHash === hashedToken);
            if (!adminSessionSlot) {
                // Shouldn't happen, but guard defensively
                res.status(401).json({ success: false, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
                return;
            }
        } else {
            // ── Student/teacher path: existing single-slot lookup ───────────────────
            user = await User.findOne({ activeSessionToken: hashedToken })
                .select('+currentDeviceId +activeSessionToken +sessionStatus');
        }

        if (!user) {
            res.status(401).json({
                success: false,
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token',
            });
            return;
        }

        // Guard: blocked or invalidated
        if (user.isBlocked) {
            clearRefreshTokenCookie(res);
            res.status(403).json({
                success: false,
                code: 'ACCOUNT_BLOCKED',
                message: 'Your account has been disabled.',
            });
            return;
        }

        if (user.sessionStatus === 'invalidated') {
            clearRefreshTokenCookie(res);
            res.status(401).json({
                success: false,
                code: 'SESSION_INVALIDATED',
                message: 'Session has been ended. Please log in again.',
            });
            return;
        }

        // Rotate the refresh token
        const newRawRefreshToken = generateRefreshToken();
        const newHashedRefreshToken = hashRefreshToken(newRawRefreshToken);

        let deviceFingerprintForNewToken: string;

        if (isAdminSession && adminSessionSlot) {
            // Admin: rotate only the matched slot, leave all other device slots intact
            adminSessionSlot.tokenHash  = newHashedRefreshToken;
            adminSessionSlot.lastUsedAt = new Date();
            user.markModified('adminSessions');
            deviceFingerprintForNewToken = adminSessionSlot.deviceFingerprint;
        } else {
            // Student/teacher: single-slot rotation
            user.activeSessionToken = newHashedRefreshToken;
            deviceFingerprintForNewToken = user.currentDeviceId!;
        }

        await user.save();
        setRefreshTokenCookie(res, newRawRefreshToken);

        const newAccessToken = signAccessToken(String(user._id), deviceFingerprintForNewToken);

        res.status(200).json({
            success: true,
            token: newAccessToken,
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

// ── @route   GET /api/auth/me ─────────────────────────────────────────────────
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

// ── @route   POST /api/auth/forgot-password ───────────────────────────────────
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), async (req: Request, res: Response, next) => {
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

// ── @route   POST /api/auth/reset-password ────────────────────────────────────
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), async (req: Request, res: Response, next) => {
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

        const user = await User.findById(resetToken.userId).select('+currentDeviceId +activeSessionToken');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;

        // Invalidate existing device session on password reset (security best practice)
        user.currentDeviceId = undefined;
        user.activeSessionToken = undefined;
        user.sessionStatus = 'invalidated';

        await user.save();

        resetToken.used = true;
        await resetToken.save();

        // Clear refresh token cookie
        clearRefreshTokenCookie(res);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. Please log in again.',
        });
    } catch (error) {
        next(error);
    }
});

// ── @route   PUT /api/auth/profile ────────────────────────────────────────────
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validate(updateProfileSchema), async (req: AuthRequest, res: Response, next) => {
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

// ── @route   PUT /api/auth/change-password ────────────────────────────────────
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, validate(changePasswordSchema), async (req: AuthRequest, res: Response, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            throw new AppError('Please provide current and new password', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('New password must be at least 6 characters', 400);
        }

        const user = await User.findById(userId)
            .select('+password +currentDeviceId +activeSessionToken');
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
        // Invalidate session after password change — user must log in again
        user.currentDeviceId = undefined;
        user.activeSessionToken = undefined;
        user.sessionStatus = 'invalidated';
        await user.save();

        clearRefreshTokenCookie(res);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please log in again.',
        });
    } catch (error) {
        next(error);
    }
});

// ── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', (req: Request, res: Response, next) => {
    // Pass client deviceId through OAuth state parameter
    const deviceId = (req.query.deviceId as string) || crypto.randomUUID();
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: deviceId,
    })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req: any, res: Response) => {
        try {
            const user = req.user;

            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
            }

            // Retrieve deviceId from OAuth state
            const clientDeviceId = (req.query.state as string) || crypto.randomUUID();
            const fingerprint = buildServerDeviceFingerprint(clientDeviceId, req);

            // Check for existing active session (block mode)
            // Admins are exempt — they can use multiple devices.
            const freshUser = await User.findById(user._id)
                .select('+currentDeviceId +activeSessionToken +sessionStatus');

            if (
                freshUser &&
                freshUser.role !== 'admin' &&
                freshUser.currentDeviceId &&
                freshUser.sessionStatus === 'active' &&
                freshUser.currentDeviceId !== fingerprint
            ) {
                const sdlMode = process.env.SINGLE_DEVICE_MODE || 'block';
                if (sdlMode === 'block') {
                    return res.redirect(
                        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=account_active_elsewhere`
                    );
                }
            }

            // Bind device session and get the real refresh token
            let rawRefreshToken: string;
            if (freshUser) {
                rawRefreshToken = await bindDeviceSession(freshUser, fingerprint, req);
            } else {
                // Fallback: fetch user and bind session
                const targetUser = await User.findById(user._id)
                    .select('+currentDeviceId +activeSessionToken +sessionStatus');
                if (!targetUser) {
                    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
                }
                rawRefreshToken = await bindDeviceSession(targetUser, fingerprint, req);
            }

            const accessToken = signAccessToken(String(user._id), clientDeviceId);
            // Set the real refresh token cookie (not a throwaway)
            setRefreshTokenCookie(res, rawRefreshToken);

            res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?token=${accessToken}`
            );
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
        }
    }
);

// ── @route   DELETE /api/auth/delete-account ─────────────────────────────────
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/delete-account', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Delete associated data
        const { Enrollment } = await import('../models/Enrollment');
        await Enrollment.deleteMany({ userId });

        const { VideoProgress } = await import('../models/VideoProgress');
        await VideoProgress.deleteMany({ userId });

        const { Notification } = await import('../models/Notification');
        await Notification.deleteMany({ userId });

        const { Doubt } = await import('../models/Doubt');
        await Doubt.deleteMany({ userId });

        const { QuizAttempt } = await import('../models/QuizAttempt');
        await QuizAttempt.deleteMany({ userId });

        const { QuizResult } = await import('../models/QuizResult');
        await QuizResult.deleteMany({ userId });

        await User.findByIdAndDelete(userId);

        clearRefreshTokenCookie(res);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ── @route   POST /api/auth/admin/invalidate-session ─────────────────────────
// @desc    Admin endpoint to force-logout a specific user
// @access  Admin only
router.post('/admin/invalidate-session', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        if (req.user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin only' });
            return;
        }

        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' });
            return;
        }

        const targetUser = await User.findById(userId)
            .select('+currentDeviceId +activeSessionToken +adminSessions');
        if (!targetUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Pass no fingerprint — clears ALL sessions for this user (all devices)
        await clearDeviceSession(targetUser, undefined);
        console.log(`🔐 Admin ${req.user.email} force-logged-out user ${targetUser.email} (all devices)`);

        res.status(200).json({
            success: true,
            message: `Session invalidated for ${targetUser.email}`,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
