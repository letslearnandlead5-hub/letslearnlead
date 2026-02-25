import { Router, Request, Response } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { cache, TTL } from '../utils/cache';

const router = Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const { category, level, search, medium } = req.query;

        // Build a stable cache key from query params
        const cacheKey = `courses:${category || ''}:${level || ''}:${search || ''}:${medium || ''}`;

        // Return cached result if still fresh (avoids DB hit on every page load)
        const cached = cache.get<any[]>(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                count: cached.length,
                data: cached,
                cached: true,
            });
        }

        const filter: any = {};
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (search) filter.title = { $regex: search, $options: 'i' };
        // medium filter: match exact medium OR 'both' (available for all)
        if (medium && medium !== 'all') {
            filter.medium = { $in: [medium, 'both'] };
        }

        // Use lean() for better performance and select only needed fields.
        // studentsEnrolled is already maintained as a counter on the Course document
        // — no need for a separate expensive User.aggregate() on every request.
        const courses = await Course.find(filter)
            .select('title description instructor thumbnail price originalPrice rating studentsEnrolled duration category level')
            .lean()
            .exec();

        // Cache results for TTL seconds
        cache.set(cacheKey, courses, TTL.COURSES_LIST);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/courses/enrolled/my-courses
// @desc    Get user's enrolled courses
// @access  Private (Student)
router.get('/enrolled/my-courses', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findById(req.user?.id).populate('enrolledCourses');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            count: user.enrolledCourses.length,
            data: user.enrolledCourses,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get('/:id', async (req: Request, res: Response, next) => {
    try {
        const course = await Course.findById(req.params.id).populate('quizId');

        if (!course) {
            throw new AppError('Course not found', 404);
        }

        res.status(200).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin/Teacher)
router.post('/', protect, authorize('admin', 'teacher'), async (req: Request, res: Response, next) => {
    try {
        const course = await Course.create(req.body);

        // Invalidate all course list caches so new course appears immediately
        cache.invalidatePrefix('courses:');

        res.status(201).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Admin/Teacher)
router.put('/:id', protect, authorize('admin', 'teacher'), async (req: Request, res: Response, next) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Invalidate course caches on update
        cache.invalidatePrefix('courses:');
        cache.invalidate(`course:${req.params.id}`);

        res.status(200).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Invalidate caches on delete
        cache.invalidatePrefix('courses:');
        cache.invalidate(`course:${req.params.id}`);

        res.status(200).json({
            success: true,
            message: 'Course deleted',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course (FREE COURSES ONLY - Use payment API for paid courses)
// @access  Private (Student)
router.post('/:id/enroll', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if course is paid - redirect to payment
        if (course.price > 0) {
            throw new AppError('This is a paid course. Please use the payment endpoint to enroll.', 400);
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if already enrolled
        if (user.enrolledCourses.includes(course._id)) {
            throw new AppError('Already enrolled in this course', 400);
        }

        // Add course to user's enrolled courses (FREE COURSE)
        user.enrolledCourses.push(course._id);
        await user.save();

        // Create enrollment record for progress tracking
        const { Enrollment } = await import('../models/Enrollment');
        await Enrollment.create({
            userId: user._id,
            courseId: course._id,
            status: 'paid', // Free course = automatically "paid"
            completionPercentage: 0,
            purchaseDate: new Date(),
        });

        // Increment students enrolled count
        course.studentsEnrolled += 1;
        await course.save();

        // Create notification for successful enrollment
        const { Notification } = await import('../models/Notification');
        await Notification.create({
            userId: user._id,
            title: 'Course Enrollment Successful!',
            message: `You have successfully enrolled in "${course.title}". Start learning now!`,
            type: 'success',
            link: `/courses/${course._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
