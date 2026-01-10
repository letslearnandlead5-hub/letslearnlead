import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { VideoProgress } from '../models/VideoProgress';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../middleware/error';

const router = Router();

// @route   POST /api/progress
// @desc    Save or update video progress
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, lessonId, progress } = req.body;
        const userId = req.user._id;

        // Validate inputs
        if (!courseId || !lessonId || progress === undefined) {
            throw new AppError('Missing required fields', 400);
        }

        // Validate progress range
        if (progress < 0 || progress > 100) {
            throw new AppError('Progress must be between 0 and 100', 400);
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({
            userId,
            courseId,
            status: 'paid',
        });

        if (!enrollment && course.price > 0) {
            throw new AppError('You must enroll in this course first', 403);
        }

        // Mark as completed if progress >= 90%
        const completed = progress >= 90;

        // Update or create progress
        const videoProgress = await VideoProgress.findOneAndUpdate(
            { userId, courseId, lessonId },
            {
                progress,
                completed,
                lastWatchedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        // Update enrollment completion percentage
        if (enrollment) {
            const allProgress = await VideoProgress.find({ userId, courseId });

            // Calculate total lessons from sections structure
            let totalLessons = 0;
            if (course.sections) {
                for (const section of course.sections) {
                    for (const subsection of section.subsections || []) {
                        totalLessons += subsection.content?.length || 0;
                    }
                }
            }

            const completedLessons = allProgress.filter((p) => p.completed).length;
            const completionPercentage = totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            enrollment.completionPercentage = completionPercentage;
            await enrollment.save();
        }

        res.status(200).json({
            success: true,
            progress: videoProgress,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/progress/:courseId
// @desc    Get all video progress for a course
// @access  Private
router.get('/:courseId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const progressList = await VideoProgress.find({ userId, courseId });

        res.status(200).json({
            success: true,
            progress: progressList,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/progress/:courseId/:lessonId
// @desc    Get progress for a specific lesson
// @access  Private
router.get('/:courseId/:lessonId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, lessonId } = req.params;
        const userId = req.user._id;

        const progress = await VideoProgress.findOne({ userId, courseId, lessonId });

        res.status(200).json({
            success: true,
            progress: progress || { progress: 0, completed: false },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/progress/user/stats
// @desc    Get overall progress statistics for user
// @access  Private
router.get('/user/stats', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const userId = req.user._id;

        // Get all enrollments
        const enrollments = await Enrollment.find({ userId, status: 'paid' })
            .populate('courseId', 'title thumbnail');

        // Get progress for each enrollment
        const stats = await Promise.all(
            enrollments.map(async (enrollment) => {
                const courseId = enrollment.courseId._id;
                const progress = await VideoProgress.find({ userId, courseId });
                const totalVideos = progress.length;
                const completedVideos = progress.filter((p) => p.completed).length;

                // Find last watched video
                const lastWatched = progress.sort(
                    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
                )[0];

                return {
                    enrollment,
                    totalVideos,
                    completedVideos,
                    completionPercentage: enrollment.completionPercentage || 0,
                    lastWatchedAt: lastWatched?.lastWatchedAt || null,
                    lastWatchedLessonId: lastWatched?.lessonId || null,
                };
            })
        );

        res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
