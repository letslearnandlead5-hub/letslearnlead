import { Router, Response } from 'express';
import { Enrollment } from '../models/Enrollment';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/enrollment/my-enrollments
// @desc    Get all subject-level enrollments for the logged-in student
// @access  Private
router.get('/my-enrollments', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        // Query per-subject Enrollment records directly (source of truth)
        const enrollments = await Enrollment.find({ userId: req.user?.id })
            .populate({
                path: 'courseId',
                select: 'title thumbnail instructor duration level category subjects grade',
            })
            .sort({ createdAt: -1 })
            .lean();

        const enriched = enrollments
            .filter((e: any) => e.courseId)
            .map((e: any) => {
                const course = e.courseId;
                const subjectMeta = (course.subjects || []).find(
                    (s: any) => s._id?.toString() === e.subjectId?.toString()
                );

                return {
                    _id: e._id,
                    courseId: course,
                    userId: e.userId,
                    subjectId: e.subjectId?.toString() || null,
                    subjectName: e.subjectName || subjectMeta?.name || null,
                    subjectIcon: subjectMeta?.icon || '\ud83d\udcda',
                    status: e.status || 'paid',
                    completionPercentage: e.completionPercentage || 0,
                    purchaseDate: e.purchaseDate,
                    amount: e.amount,
                    currency: e.currency,
                    invoiceUrl: e.invoiceUrl,
                    invoiceNumber: e.invoiceNumber,
                    createdAt: e.createdAt,
                    updatedAt: e.updatedAt,
                };
            });

        res.status(200).json({
            success: true,
            count: enriched.length,
            data: enriched,
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
// @desc    Update course/subject progress
// @access  Private
router.put('/progress/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { completionPercentage, completedLessons, subjectId } = req.body;
        const { courseId } = req.params;
        const enrollmentQuery: any = {
            userId: req.user?.id,
            courseId: courseId,
        };
        if (subjectId) enrollmentQuery.subjectId = subjectId;

        // Find or create enrollment
        let enrollment = await Enrollment.findOne(enrollmentQuery);

        if (!enrollment) {
            // Create new enrollment if doesn't exist (for free courses)
            enrollment = await Enrollment.create({
                userId: req.user?.id,
                courseId: courseId,
                subjectId: subjectId || courseId,
                status: 'paid',
                completionPercentage: completionPercentage || 0,
                completedLessons: Array.isArray(completedLessons) ? completedLessons : [],
                purchaseDate: new Date(),
            });
        } else {
            // Update existing enrollment
            enrollment.completionPercentage =
                typeof completionPercentage === 'number'
                    ? completionPercentage
                    : enrollment.completionPercentage;
            if (Array.isArray(completedLessons)) {
                enrollment.completedLessons = completedLessons;
            }
            enrollment.updatedAt = new Date();
            await enrollment.save();
        }

        // Save completedLessons to User model
        if (completedLessons && Array.isArray(completedLessons)) {
            const { User } = await import('../models/User');
            const user = await User.findById(req.user?.id);

            if (user) {
                // Find or create course progress entry
                const courseProgressIndex = user.courseProgress?.findIndex(
                    (cp: any) => cp.courseId.toString() === courseId
                );

                if (courseProgressIndex !== undefined && courseProgressIndex >= 0) {
                    // Update existing progress
                    user.courseProgress[courseProgressIndex].completedLessons = completedLessons;
                    user.courseProgress[courseProgressIndex].lastAccessed = new Date();
                } else {
                    // Create new progress entry
                    if (!user.courseProgress) user.courseProgress = [];
                    user.courseProgress.push({
                        courseId: courseId,
                        completedLessons: completedLessons,
                        lastAccessed: new Date(),
                    });
                }

                await user.save();
                console.log(`💾 Saved ${completedLessons.length} completed lessons for user ${user.email}`);
            }
        }

        res.status(200).json({
            success: true,
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/enrollment/progress/:courseId
// @desc    Get course/subject progress
// @access  Private
router.get('/progress/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId } = req.params;
        const { subjectId } = req.query;
        const enrollmentQuery: any = {
            userId: req.user?.id,
            courseId: courseId,
        };
        if (subjectId) enrollmentQuery.subjectId = subjectId;

        // Find user's enrollment
        const enrollment = await Enrollment.findOne(enrollmentQuery);

        if (!enrollment) {
            return res.status(200).json({
                success: true,
                completedLessons: [],
                completionPercentage: 0,
            });
        }

        res.status(200).json({
            success: true,
            completedLessons: enrollment.completedLessons || [],
            completionPercentage: enrollment.completionPercentage || 0,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/enrollment/verify/:courseId
// @desc    Verify if user is enrolled in a course
// @access  Private
router.get('/verify/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId } = req.params;
        const { User } = await import('../models/User');

        // Check if user is enrolled in the course
        const user = await User.findById(req.user?.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if course is in user's enrolledCourses
        const isEnrolled = user.enrolledCourses.some(
            (enrolledCourseId: any) => enrolledCourseId.toString() === courseId
        );

        if (!isEnrolled) {
            // Log unauthorized access attempt
            console.log(`🚫 Unauthorized access attempt:`, {
                userId: req.user?.id,
                email: user.email,
                courseId,
                timestamp: new Date().toISOString(),
                ip: req.ip || req.socket.remoteAddress,
            });

            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course',
                enrolled: false,
            });
        }

        // Log successful video access
        console.log(`✅ Video access granted:`, {
            userId: req.user?.id,
            email: user.email,
            courseId,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.socket.remoteAddress,
        });

        res.status(200).json({
            success: true,
            enrolled: true,
            message: 'User is enrolled in this course',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
