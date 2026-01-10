import { Router, Response } from 'express';
import { Enrollment } from '../models/Enrollment';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/enrollment/my-enrollments
// @desc    Get all enrollments for logged-in user with progress
// @access  Private
router.get('/my-enrollments', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { User } = await import('../models/User');

        // Get user with populated enrolledCourses
        const user = await User.findById(req.user?.id).populate('enrolledCourses');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Get all enrollment records (for payment info and completion tracking)
        const enrollments = await Enrollment.find({ userId: req.user?.id })
            .sort({ createdAt: -1 });

        // Create a map of courseId to enrollment data
        const enrollmentMap = new Map();
        enrollments.forEach((enrollment) => {
            enrollmentMap.set(enrollment.courseId.toString(), enrollment);
        });

        // Transform user's enrolled courses to include enrollment data
        const enrichedEnrollments = user.enrolledCourses.map((course: any) => {
            const enrollment = enrollmentMap.get(course._id.toString());

            return {
                _id: enrollment?._id || course._id,
                courseId: course,
                userId: req.user?.id,
                status: enrollment?.status || 'paid', // Default to 'paid' for free courses
                purchaseDate: enrollment?.purchaseDate || course.createdAt,
                completionPercentage: enrollment?.completionPercentage || 0,
                createdAt: enrollment?.createdAt || course.createdAt,
                updatedAt: enrollment?.updatedAt || course.updatedAt,
                // Include payment details if available
                ...(enrollment && {
                    razorpayOrderId: enrollment.razorpayOrderId,
                    razorpayPaymentId: enrollment.razorpayPaymentId,
                    amount: enrollment.amount,
                    currency: enrollment.currency,
                    invoiceUrl: enrollment.invoiceUrl,
                    invoiceNumber: enrollment.invoiceNumber,
                }),
            };
        });

        res.status(200).json({
            success: true,
            count: enrichedEnrollments.length,
            data: enrichedEnrollments,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/enrollment/:id
// @desc    Get single enrollment
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id).populate('courseId');

        if (!enrollment) {
            throw new AppError('Enrollment not found', 404);
        }

        // Check if user owns this enrollment
        if (enrollment.userId.toString() !== req.user?.id) {
            throw new AppError('Not authorized to access this enrollment', 403);
        }

        res.status(200).json({
            success: true,
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/enrollment/progress/:courseId
// @desc    Update course progress
// @access  Private
router.put('/progress/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { completionPercentage, completedLessons } = req.body;
        const { courseId } = req.params;

        // Find or create enrollment
        let enrollment = await Enrollment.findOne({
            userId: req.user?.id,
            courseId: courseId,
        });

        if (!enrollment) {
            // Create new enrollment if doesn't exist (for free courses)
            enrollment = await Enrollment.create({
                userId: req.user?.id,
                courseId: courseId,
                status: 'paid',
                completionPercentage: completionPercentage || 0,
                purchaseDate: new Date(),
            });
        } else {
            // Update existing enrollment
            enrollment.completionPercentage = completionPercentage || enrollment.completionPercentage;
            enrollment.updatedAt = new Date();
            await enrollment.save();
        }

        res.status(200).json({
            success: true,
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
