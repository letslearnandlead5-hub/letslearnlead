import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { Notification } from '../models/Notification';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import {
    sendPaymentSubmittedEmail,
    sendPaymentApprovedEmail,
    sendPaymentRejectedEmail,
} from '../utils/emailService';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/payments/course/:courseId
// @desc    Get public payment info for a course (QR, UPI, price, instructions)
// @access  Private (any logged-in user)
router.get('/course/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .select('title price currency paymentEnabled paymentMethod upiId merchantName paymentInstructions qrImage thumbnail instructor');

        if (!course) throw new AppError('Course not found', 404);
        if (!course.paymentEnabled) throw new AppError('This course does not require payment', 400);

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/payments/status/:courseId
// @desc    Check student's payment status for a specific course
// @access  Private (Student)
router.get('/status/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const payment = await Payment.findOne({
            studentId: req.user?.id,
            courseId: req.params.courseId,
        }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(200).json({ success: true, data: null, status: 'none' });
        }

        res.status(200).json({ success: true, data: payment, status: payment.paymentStatus });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/payments/submit
// @desc    Student submits payment details after QR scan
// @access  Private (Student)
router.post('/submit', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            courseId,
            studentName,
            studentEmail,
            studentPhone,
            transactionId,
            paymentScreenshot,
            notes,
        } = req.body;

        // Validation
        if (!courseId || !studentName || !studentEmail || !studentPhone || !transactionId) {
            throw new AppError('Please fill all required fields', 400);
        }

        // Phone validation
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(studentPhone.replace(/\s/g, ''))) {
            throw new AppError('Please enter a valid 10-digit Indian phone number', 400);
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentEmail)) {
            throw new AppError('Please enter a valid email address', 400);
        }

        // Transaction ID validation - alphanumeric, 8-50 chars
        if (transactionId.length < 6 || transactionId.length > 100) {
            throw new AppError('Transaction ID must be between 6 and 100 characters', 400);
        }

        // Screenshot size check (base64 ~5MB = ~6.7MB base64 string)
        if (paymentScreenshot && paymentScreenshot.length > 7 * 1024 * 1024) {
            throw new AppError('Screenshot must be smaller than 5MB', 400);
        }

        // Get course
        const course = await Course.findById(courseId);
        if (!course) throw new AppError('Course not found', 404);
        if (!course.paymentEnabled) throw new AppError('This course does not require payment', 400);

        // Check if already enrolled
        const user = await User.findById(req.user?.id);
        if (user && user.enrolledCourses.some((id: any) => id.toString() === courseId)) {
            throw new AppError('You are already enrolled in this course', 400);
        }

        // Check for duplicate pending/approved payment for this course
        const existingPayment = await Payment.findOne({
            studentId: req.user?.id,
            courseId,
            paymentStatus: { $in: ['pending', 'approved'] },
        });
        if (existingPayment) {
            if (existingPayment.paymentStatus === 'approved') {
                throw new AppError('Your payment has already been approved for this course', 400);
            }
            throw new AppError('You already have a pending payment for this course. Please wait for admin verification.', 400);
        }

        // Create payment record
        const payment = await Payment.create({
            studentId: req.user?.id,
            studentName: studentName.trim(),
            studentEmail: studentEmail.toLowerCase().trim(),
            studentPhone: studentPhone.trim(),
            courseId,
            courseName: course.title,
            amount: course.price,
            currency: course.currency || 'INR',
            paymentMethod: 'qr',
            transactionId: transactionId.trim(),
            paymentScreenshot: paymentScreenshot || '',
            notes: notes?.trim() || '',
            paymentStatus: 'pending',
            paymentDate: new Date(),
        });

        // Send in-app notification to student
        await Notification.create({
            userId: req.user?.id,
            title: 'Payment Submitted Successfully',
            message: `Your payment for "${course.title}" has been submitted. We'll notify you once it's verified.`,
            type: 'info',
            link: '/dashboard/',
        });

        // Send in-app notification to all admins
        const admins = await User.find({ role: 'admin' });
        await Promise.all(admins.map((admin) =>
            Notification.create({
                userId: admin._id,
                title: 'New Payment Received',
                message: `${studentName} submitted payment for "${course.title}" — Transaction ID: ${transactionId}`,
                type: 'info',
                link: '/dashboard/',
            })
        ));

        // Send email notifications (non-blocking)
        sendPaymentSubmittedEmail(studentEmail, studentName, course.title, transactionId, course.price)
            .catch((err) => console.error('Payment submitted email error:', err));

        res.status(201).json({
            success: true,
            message: 'Payment submitted successfully. Admin will verify shortly.',
            data: { _id: payment._id, paymentStatus: payment.paymentStatus },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/payments/my
// @desc    Student gets their own payment records
// @access  Private (Student)
router.get('/my', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const payments = await Payment.find({ studentId: req.user?.id })
            .sort({ createdAt: -1 })
            .populate('courseId', 'title thumbnail instructor price');

        const summary = {
            pending: payments.filter((p) => p.paymentStatus === 'pending').length,
            approved: payments.filter((p) => p.paymentStatus === 'approved').length,
            rejected: payments.filter((p) => p.paymentStatus === 'rejected').length,
        };

        res.status(200).json({ success: true, data: payments, summary });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/payments/admin
// @desc    Admin gets all payments with filters
// @access  Private (Admin)
router.get('/admin', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { status, courseId, search, startDate, endDate, page = '1', limit = '20' } = req.query;

        const filter: any = {};
        if (status) filter.paymentStatus = status;
        if (courseId) filter.courseId = new mongoose.Types.ObjectId(courseId as string);
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentEmail: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
                { courseName: { $regex: search, $options: 'i' } },
            ];
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('courseId', 'title thumbnail price')
                .populate('studentId', 'name email phone profilePicture')
                .populate('verifiedBy', 'name email'),
            Payment.countDocuments(filter),
        ]);

        const summary = await Payment.aggregate([
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        ]);

        const summaryMap = { pending: 0, approved: 0, rejected: 0 };
        summary.forEach((s: any) => { summaryMap[s._id as keyof typeof summaryMap] = s.count; });

        res.status(200).json({
            success: true,
            data: payments,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            summary: summaryMap,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/payments/approve/:id
// @desc    Admin approves payment → auto-enroll student
// @access  Private (Admin)
router.put('/approve/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { adminRemark } = req.body;

        const payment = await Payment.findById(req.params.id);
        if (!payment) throw new AppError('Payment not found', 404);
        if (payment.paymentStatus === 'approved') throw new AppError('Payment already approved', 400);

        // Update payment record
        payment.paymentStatus = 'approved';
        payment.verifiedBy = new mongoose.Types.ObjectId(req.user?.id);
        payment.verifiedDate = new Date();
        payment.adminRemark = adminRemark || '';
        await payment.save();

        // Enroll student: add courseId to user's enrolledCourses
        const user = await User.findById(payment.studentId);
        if (user && !user.enrolledCourses.some((id: any) => id.toString() === payment.courseId.toString())) {
            user.enrolledCourses.push(payment.courseId);
            await user.save();
        }

        // Create or update Enrollment record
        const existingEnrollment = await Enrollment.findOne({
            userId: payment.studentId,
            courseId: payment.courseId,
        });

        if (!existingEnrollment) {
            await Enrollment.create({
                userId: payment.studentId,
                courseId: payment.courseId,
                status: 'paid',
                amount: payment.amount,
                currency: payment.currency,
                purchaseDate: new Date(),
                completionPercentage: 0,
            });
        }

        // Update course students count
        await Course.findByIdAndUpdate(payment.courseId, { $inc: { studentsEnrolled: 1 } });

        // In-app notification to student
        await Notification.create({
            userId: payment.studentId,
            title: '🎉 Payment Approved!',
            message: `Your payment for "${payment.courseName}" has been approved! You can now access the course.`,
            type: 'success',
            link: '/dashboard/',
        });

        // Send approval email (non-blocking)
        sendPaymentApprovedEmail(payment.studentEmail, payment.studentName, payment.courseName, adminRemark)
            .catch((err) => console.error('Approval email error:', err));

        res.status(200).json({ success: true, message: 'Payment approved and student enrolled successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/payments/reject/:id
// @desc    Admin rejects payment
// @access  Private (Admin)
router.put('/reject/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { adminRemark } = req.body;

        if (!adminRemark || !adminRemark.trim()) {
            throw new AppError('Please provide a reason for rejection', 400);
        }

        const payment = await Payment.findById(req.params.id);
        if (!payment) throw new AppError('Payment not found', 404);
        if (payment.paymentStatus === 'approved') throw new AppError('Cannot reject an approved payment', 400);

        payment.paymentStatus = 'rejected';
        payment.verifiedBy = new mongoose.Types.ObjectId(req.user?.id);
        payment.verifiedDate = new Date();
        payment.adminRemark = adminRemark.trim();
        await payment.save();

        // In-app notification to student
        await Notification.create({
            userId: payment.studentId,
            title: '❌ Payment Rejected',
            message: `Your payment for "${payment.courseName}" was rejected. Reason: ${adminRemark}`,
            type: 'error',
            link: '/dashboard/',
        });

        // Send rejection email (non-blocking)
        sendPaymentRejectedEmail(payment.studentEmail, payment.studentName, payment.courseName, adminRemark)
            .catch((err) => console.error('Rejection email error:', err));

        res.status(200).json({ success: true, message: 'Payment rejected successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
