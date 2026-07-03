import { Router, Request, Response } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { cache, TTL } from '../utils/cache';
import * as jwt from 'jsonwebtoken';

const router = Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const startTime = Date.now();
        const { category, level, search, medium, featured, grade, page = '1', limit = '100' } = req.query;

        // Build a stable cache key from query params
        const cacheKey = `courses:${category || ''}:${level || ''}:${search || ''}:${medium || ''}:${featured || ''}:${grade || ''}:${page}:${limit}`;

        // TEMPORARILY DISABLE CACHE FOR DEBUGGING
        // Return cached result if still fresh (avoids DB hit on every page load)
        // const cached = cache.get<any[]>(cacheKey);
        // if (cached) {
        //     console.log(`✅ Cache HIT for ${cacheKey} - ${Date.now() - startTime}ms`);
        //     return res.status(200).json({
        //         success: true,
        //         count: cached.length,
        //         data: cached,
        //         cached: true,
        //     });
        // }

        // Minimal logging - only log slow queries
        // console.log(`⏳ Cache MISS for ${cacheKey} - Fetching from DB...`);
        // console.log(`📋 Filter params:`, { category, level, search, medium, featured, grade });

        const filter: any = {};
        if (category && category !== 'all') filter.category = category;
        if (level) filter.level = level;
        if (grade && grade !== 'All') filter.grade = grade;
        
        // Enhanced search: search in title, description, category, and instructor
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { instructor: { $regex: search, $options: 'i' } },
            ];
        }
        
        // medium filter: exact match only
        if (medium && medium !== 'all') {
            filter.medium = medium;
        }
        // homepage featured filter - explicitly check for true/false
        if (featured === 'true') {
            filter.featuredOnHome = true;
        } else if (featured === 'false') {
            filter.featuredOnHome = false;
        }

        // console.log(`🔍 MongoDB filter:`, JSON.stringify(filter));
        // console.log(`🔍 Grade filter specifically:`, grade, '→', filter.grade);

        const dbStartTime = Date.now();
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Use lean() for better performance and select only needed fields.
        // studentsEnrolled is already maintained as a counter on the Course document
        // — no need for a separate expensive User.aggregate() on every request.
        const courses = await Course.find(filter)
            .select('title description instructor thumbnail price originalPrice rating studentsEnrolled duration category level medium grade featuredOnHome')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean()
            .exec();

        const dbTime = Date.now() - dbStartTime;
        // console.log(`📊 DB Query took ${dbTime}ms - Found ${courses.length} courses`);
        // console.log(`📊 Courses returned:`, courses.map(c => ({ title: c.title, grade: c.grade, category: c.category, medium: c.medium })));

        // Cache results for TTL seconds - TEMPORARILY DISABLED
        // cache.set(cacheKey, courses, TTL.COURSES_LIST);

        const totalTime = Date.now() - startTime;
        
        // Only log slow queries (> 100ms)
        if (totalTime > 100) {
            console.log(`⚠️ Slow query (${totalTime}ms): ${cacheKey}`);
        }

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
            page: pageNum,
            limit: limitNum,
        });
    } catch (error) {
        console.error('❌ Error in GET /courses:', error);
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

        let isAuthorized = false;

        // Extract token if present
        let token: string | undefined;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (course.price === 0) {
            isAuthorized = true;
        } else if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
                const user = await User.findById(decoded.id);
                if (user) {
                    if (user.role === 'admin' || user.role === 'teacher') {
                        isAuthorized = true;
                    } else {
                        // Check if enrolled
                        isAuthorized = user.enrolledCourses.some(
                            (enrolledCourseId: any) => enrolledCourseId.toString() === course._id.toString()
                        );
                    }
                }
            } catch (err) {
                // Token verification failed or user not found, treat as guest/unauthorized
            }
        }

        // Redact premium contents if not authorized
        let responseData = course.toObject();
        if (!isAuthorized) {
            // Redact new sections structure
            if (responseData.sections) {
                responseData.sections = responseData.sections.map((section: any) => ({
                    ...section,
                    subsections: (section.subsections || []).map((subsection: any) => ({
                        ...subsection,
                        content: (subsection.content || []).map((item: any) => {
                            if (!item.isFree) {
                                return {
                                    ...item,
                                    videoUrl: '',
                                    articleContent: '',
                                };
                            }
                            return item;
                        }),
                    })),
                }));
            }

            // Redact legacy lessons
            if (responseData.lessons) {
                responseData.lessons = responseData.lessons.map((lesson: any) => ({
                    ...lesson,
                    videoUrl: '', // No isFree flag in legacy, hide by default
                }));
            }
        }

        res.status(200).json({
            success: true,
            data: responseData,
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

// @route   POST /api/courses/cache/clear
// @desc    Clear course cache (for debugging)
// @access  Public (temporary for debugging)
router.post('/cache/clear', async (req: Request, res: Response) => {
    try {
        cache.invalidatePrefix('courses:');
        console.log('🗑️ Cleared all course caches');
        res.status(200).json({
            success: true,
            message: 'Course cache cleared successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
        });
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
