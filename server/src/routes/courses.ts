import { Router, Request, Response } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
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
        const { category, level, search, medium, featured, grade, page = '1', limit = '100', noThumbnail } = req.query;

        // Build a stable cache key from query params
        const cacheKey = `courses:${category || ''}:${level || ''}:${search || ''}:${medium || ''}:${featured || ''}:${grade || ''}:${page}:${limit}:${noThumbnail || ''}`;

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
        if (category && category !== 'all') filter.category = category;
        if (level) filter.level = level;
        if (grade && grade !== 'All') filter.grade = grade;

        // Use MongoDB $text search (uses existing text index on title+description)
        // Falls back to targeted regex on category/instructor which ARE indexed fields.
        if (search) {
            const searchStr = String(search);
            filter.$or = [
                { $text: { $search: searchStr } },
                { category: { $regex: searchStr, $options: 'i' } },
                { instructor: { $regex: searchStr, $options: 'i' } },
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

        const dbStartTime = Date.now();
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // When noThumbnail=true (e.g. admin table), exclude the large base64 thumbnail
        // field to keep the payload small. For subjects, only include lightweight fields
        // (name, icon, price) — not full sections — to keep the list payload small.
        const selectFields = noThumbnail === 'true'
            ? '-thumbnail -sections -lessons -subjects.sections -qrImage'
            : '-sections -lessons -subjects.sections -qrImage';

        const courses = await Course.find(filter)
            .select(selectFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean()
            .exec();

        const dbTime = Date.now() - dbStartTime;

        // Cache results to avoid hitting DB on every page load
        cache.set(cacheKey, courses, TTL.COURSES_LIST);

        const totalTime = Date.now() - startTime;

        // Log slow queries (> 200ms)
        if (totalTime > 200) {
            console.log(`⚠️ Slow query (${totalTime}ms, DB: ${dbTime}ms): ${cacheKey}`);
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
        const singleCacheKey = `course:${req.params.id}`;

        // Extract token once, up front
        let token: string | undefined;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Serve cached (redacted) response only for unauthenticated visitors to avoid
        // leaking unredacted content to enrolled users who bypass the cache.
        if (!token) {
            const cachedCourse = cache.get<any>(singleCacheKey);
            if (cachedCourse) {
                return res.status(200).json({ success: true, data: cachedCourse, cached: true });
            }
        }

        const course = await Course.findById(req.params.id).populate('quizId');

        if (!course) {
            throw new AppError('Course not found', 404);
        }

        let isAuthorizedAdmin = false;
        const enrolledSubjectIds = new Set<string>();

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
                const user = await User.findById(decoded.id).select('role');
                if (user) {
                    if (user.role === 'admin' || user.role === 'teacher') {
                        isAuthorizedAdmin = true;
                    } else {
                        // Fetch student enrollments for this specific course
                        const enrollments = await Enrollment.find({
                            userId: user._id,
                            courseId: course._id,
                            status: 'paid'
                        }).select('subjectId');
                        
                        enrollments.forEach((e: any) => {
                            if (e.subjectId) enrolledSubjectIds.add(e.subjectId.toString());
                        });
                    }
                }
            } catch (err) {
                // Ignore token verification errors, treat as guest
            }
        }

        // Redact premium contents if not authorized
        let responseData = course.toObject();

        // 1. Redact subjects
        if (responseData.subjects) {
            responseData.subjects = responseData.subjects.map((subject: any) => {
                const subjectIdStr = subject._id ? subject._id.toString() : '';
                const hasAccess = isAuthorizedAdmin || (subject.price === 0) || enrolledSubjectIds.has(subjectIdStr);

                if (!hasAccess) {
                    // Redact content of this subject
                    return {
                        ...subject,
                        sections: (subject.sections || []).map((section: any) => ({
                            ...section,
                            subsections: (section.subsections || []).map((subsection: any) => ({
                                ...subsection,
                                content: (subsection.content || []).map((item: any) => {
                                    if (!item.isFree) {
                                        return { ...item, videoUrl: '', articleContent: '' };
                                    }
                                    return item;
                                }),
                            })),
                        })),
                    };
                }
                return subject; // Full access to this subject
            });
        }

        // 2. Redact legacy sections & lessons (if course price > 0 and user is not admin/teacher and has no enrolled subjects)
        const hasLegacyAccess = isAuthorizedAdmin || (course.price === 0) || (enrolledSubjectIds.size > 0);
        if (!hasLegacyAccess) {
            if (responseData.sections) {
                responseData.sections = responseData.sections.map((section: any) => ({
                    ...section,
                    subsections: (section.subsections || []).map((subsection: any) => ({
                        ...subsection,
                        content: (subsection.content || []).map((item: any) => {
                            if (!item.isFree) {
                                return { ...item, videoUrl: '', articleContent: '' };
                            }
                            return item;
                        }),
                    })),
                }));
            }
            if (responseData.lessons) {
                responseData.lessons = responseData.lessons.map((lesson: any) => ({
                    ...lesson,
                    videoUrl: '',
                }));
            }
        }

        // Cache the redacted public view for unauthenticated visitors
        if (!token) {
            cache.set(singleCacheKey, responseData, TTL.SINGLE_COURSE);
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
// @desc    Enroll in a course subject (FREE SUBJECTS ONLY - Use payment API for paid subjects)
// @access  Private (Student)
router.post('/:id/enroll', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { subjectId } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) throw new AppError('Course not found', 404);

        // Find the subject
        const subject = subjectId
            ? course.subjects.find((s: any) => s._id.toString() === subjectId)
            : null;

        // If subjectId given and subject has a price, redirect to payment
        if (subject && subject.price > 0) {
            throw new AppError('This subject requires payment. Please use the payment endpoint.', 400);
        }

        const user = await User.findById(req.user?.id);
        if (!user) throw new AppError('User not found', 404);

        // Add course to user's enrolled courses (course-level flag)
        if (!user.enrolledCourses.some((id: any) => id.toString() === course._id.toString())) {
            user.enrolledCourses.push(course._id);
            await user.save();
        }

        // Create enrollment record for progress tracking
        const { Enrollment } = await import('../models/Enrollment');
        await Enrollment.create({
            userId: user._id,
            courseId: course._id,
            subjectId: subject?._id || course._id, // fallback for legacy free courses
            subjectName: subject?.name || 'General',
            status: 'paid',
            completionPercentage: 0,
            purchaseDate: new Date(),
        });

        course.studentsEnrolled += 1;
        await course.save();

        const { Notification } = await import('../models/Notification');
        await Notification.create({
            userId: user._id,
            title: 'Enrollment Successful!',
            message: `You have successfully enrolled in "${subject?.name || course.title}". Start learning now!`,
            type: 'success',
            link: `/courses/${course._id}`,
        });

        res.status(200).json({
            success: true,
            message: 'Successfully enrolled',
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/courses/:id/enrolled-subjects
// @desc    Get which subjects a student is enrolled in for a given course
// @access  Private (Student)
router.get('/:id/enrolled-subjects', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { Enrollment } = await import('../models/Enrollment');
        const enrollments = await Enrollment.find({
            userId: req.user?.id,
            courseId: req.params.id,
            status: 'paid',
        }).select('subjectId subjectName').lean();

        res.status(200).json({
            success: true,
            data: enrollments,
            enrolledSubjectIds: enrollments.map((e: any) => e.subjectId?.toString()),
        });
    } catch (error) {
        next(error);
    }
});

export default router;
