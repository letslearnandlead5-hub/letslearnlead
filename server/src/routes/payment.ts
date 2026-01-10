import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// Initialize Razorpay (optional - only if keys are provided)
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'your_test_key_here' &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_test_secret_here') {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized');
} else {
    console.log('⚠️  Razorpay not initialized - payment features will be disabled');
}

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order for course purchase
// @access  Private
router.post('/create-order', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        // Check if Razorpay is configured
        if (!razorpay) {
            throw new AppError('Payment system is not configured. Please contact administrator.', 503);
        }

        const { courseId } = req.body;

        if (!courseId) {
            throw new AppError('Course ID is required', 400);
        }

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if user already purchased this course
        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.enrolledCourses.includes(course._id)) {
            throw new AppError('You have already purchased this course', 400);
        }

        // Check if there's a pending enrollment
        const existingEnrollment = await Enrollment.findOne({
            userId: user._id,
            courseId: course._id,
            status: 'paid',
        });

        if (existingEnrollment) {
            throw new AppError('You have already enrolled in this course', 400);
        }

        // Create Razorpay order
        const amount = Math.round(course.price * 100); // Convert to paise (smallest currency unit)
        const currency = 'INR';

        const orderOptions = {
            amount,
            currency,
            receipt: `course_${course._id}_user_${user._id}_${Date.now()}`,
            notes: {
                courseId: course._id.toString(),
                userId: user._id.toString(),
                courseName: course.title,
            },
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Create enrollment record with pending status
        const enrollment = await Enrollment.create({
            userId: user._id,
            courseId: course._id,
            razorpayOrderId: razorpayOrder.id,
            amount: course.price,
            currency,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                courseName: course.title,
                courseImage: course.thumbnail,
                enrollmentId: enrollment._id,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment and complete enrollment
// @access  Private
router.post('/verify', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            enrollmentId,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new AppError('Missing payment verification details', 400);
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            throw new AppError('Payment verification failed. Invalid signature.', 400);
        }

        // Find enrollment
        const enrollment = await Enrollment.findOne({
            razorpayOrderId: razorpay_order_id,
        });

        if (!enrollment) {
            throw new AppError('Enrollment not found', 404);
        }

        // Verify it's the correct user
        if (enrollment.userId.toString() !== req.user?.id) {
            throw new AppError('Unauthorized', 403);
        }

        // Check if already processed
        if (enrollment.status === 'paid') {
            throw new AppError('This payment has already been processed', 400);
        }

        // Update enrollment
        enrollment.razorpayPaymentId = razorpay_payment_id;
        enrollment.razorpaySignature = razorpay_signature;
        enrollment.status = 'paid';
        enrollment.purchaseDate = new Date();
        await enrollment.save();

        // Add course to user's enrolled courses
        const user = await User.findById(enrollment.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (!user.enrolledCourses.includes(enrollment.courseId)) {
            user.enrolledCourses.push(enrollment.courseId);
            await user.save();
        }

        // Increment students enrolled count
        const course = await Course.findById(enrollment.courseId);
        if (course) {
            course.studentsEnrolled += 1;
            await course.save();
        }

        // Create notification
        const { Notification } = await import('../models/Notification');
        await Notification.create({
            userId: user._id,
            title: 'Course Purchased Successfully! 🎉',
            message: `You have successfully purchased "${course?.title}". Start learning now!`,
            type: 'success',
            link: `/courses/${course?._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified and enrollment completed successfully',
            data: {
                courseId: enrollment.courseId,
                courseName: course?.title,
                purchaseDate: enrollment.purchaseDate,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/payment/failure
// @desc    Handle payment failure
// @access  Private
router.post('/failure', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { razorpay_order_id } = req.body;

        if (razorpay_order_id) {
            const enrollment = await Enrollment.findOne({
                razorpayOrderId: razorpay_order_id,
            });

            if (enrollment) {
                enrollment.status = 'failed';
                await enrollment.save();
            }
        }

        res.status(200).json({
            success: false,
            message: 'Payment failed',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/payment/free-enroll
// @desc    Free enrollment for course (when payment is disabled)
// @access  Private
router.post('/free-enroll', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            throw new AppError('Course ID is required', 400);
        }

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if user exists
        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if user already enrolled
        if (user.enrolledCourses.includes(course._id)) {
            throw new AppError('You have already enrolled in this course', 400);
        }

        // Check if there's an existing enrollment
        const existingEnrollment = await Enrollment.findOne({
            userId: user._id,
            courseId: course._id,
            status: 'paid',
        });

        if (existingEnrollment) {
            throw new AppError('You have already enrolled in this course', 400);
        }

        // Create enrollment record with paid status (free enrollment)
        const enrollment = await Enrollment.create({
            userId: user._id,
            courseId: course._id,
            razorpayOrderId: `FREE_${Date.now()}`,
            amount: 0,
            currency: 'INR',
            status: 'paid',
            purchaseDate: new Date(),
        });

        // Add course to user's enrolled courses
        user.enrolledCourses.push(course._id);
        await user.save();

        // Increment students enrolled count
        course.studentsEnrolled += 1;
        await course.save();

        // Create notification
        const { Notification } = await import('../models/Notification');
        await Notification.create({
            userId: user._id,
            title: 'Successfully Enrolled! 🎉',
            message: `You have successfully enrolled in "${course.title}". Start learning now!`,
            type: 'success',
            link: `/courses/${course._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Enrollment completed successfully',
            data: {
                courseId: course._id,
                courseName: course.title,
                enrollmentDate: enrollment.purchaseDate,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/payment/check-enrollment/:courseId
// @desc    Check if user has purchased a course
// @access  Private
router.get('/check-enrollment/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId } = req.params;

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isEnrolled = user.enrolledCourses.some(
            (id: mongoose.Types.ObjectId) => id.toString() === courseId
        );

        res.status(200).json({
            success: true,
            isEnrolled,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
