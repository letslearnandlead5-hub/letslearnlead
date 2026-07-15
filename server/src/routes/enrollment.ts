import { Router, Response } from 'express';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';
import { protect, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   GET /api/enrollment/my-enrollments
// @desc    Get all course-level enrollments for the logged-in student (one card per course)
// @access  Private
router.get('/my-enrollments', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const enrollments = await Enrollment.find({ userId: req.user?.id })
            .populate({
                path: 'courseId',
                select: 'title thumbnail instructor duration level category subjects grade price paymentEnabled',
            })
            .sort({ createdAt: -1 })
            .lean();

        // Group by courseId — return one card per course
        const courseMap = new Map<string, any>();

        enrollments
            .filter((e: any) => e.courseId)
            .forEach((e: any) => {
                const course = e.courseId;
                const courseIdStr = course._id.toString();

                if (!courseMap.has(courseIdStr)) {
                    courseMap.set(courseIdStr, {
                        _id: e._id,
                        courseId: course,
                        userId: e.userId,
                        isCourseLevelEnrolled: false,
                        enrolledSubjectIds: [] as string[],
                        subjects: course.subjects || [],
                        status: e.status || 'paid',
                        completionPercentage: 0,
                        completedLessons: [] as string[],
                        amount: e.amount,
                        currency: e.currency,
                        purchaseDate: e.purchaseDate,
                        createdAt: e.createdAt,
                        updatedAt: e.updatedAt,
                    });
                }

                const card = courseMap.get(courseIdStr);

                // Collect all completed lessons across matching enrollments
                if (e.completedLessons && Array.isArray(e.completedLessons)) {
                    for (const lId of e.completedLessons) {
                        if (!card.completedLessons.includes(lId)) {
                            card.completedLessons.push(lId);
                        }
                    }
                }

                if (!e.subjectId) {
                    // Course-level enrollment: unlock all subjects
                    card.isCourseLevelEnrolled = true;
                    card.enrolledSubjectIds = (course.subjects || [])
                        .map((s: any) => s._id?.toString())
                        .filter(Boolean);
                } else {
                    // Old per-subject record (backward compat)
                    const sid = e.subjectId.toString();
                    if (!card.enrolledSubjectIds.includes(sid)) {
                        card.enrolledSubjectIds.push(sid);
                    }
                }
            });

        // Compute true dynamic progress for each course card
        courseMap.forEach((card) => {
            const course = card.courseId;
            const completedSet = new Set(card.completedLessons || []);
            let totalLessons = 0;
            let completedInCourse = 0;

            if (course.subjects && Array.isArray(course.subjects)) {
                for (const subject of course.subjects) {
                    for (const section of subject.sections || []) {
                        for (const subsection of section.subsections || []) {
                            for (const item of subsection.content || []) {
                                totalLessons++;
                                if (item._id && completedSet.has(item._id.toString())) {
                                    completedInCourse++;
                                }
                            }
                        }
                    }
                }
            }

            // Also support direct legacy sections/lessons on course if any
            if (course.sections && Array.isArray(course.sections)) {
                for (const section of course.sections) {
                    for (const subsection of section.subsections || []) {
                        for (const item of subsection.content || []) {
                            totalLessons++;
                            if (item._id && completedSet.has(item._id.toString())) {
                                completedInCourse++;
                            }
                        }
                    }
                }
            }

            card.completionPercentage = totalLessons > 0
                ? Math.round((completedInCourse / totalLessons) * 100)
                : 0;
        });

        const data = Array.from(courseMap.values());

        res.status(200).json({
            success: true,
            count: data.length,
            data,
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

        // ── Server-side guard: build the set of valid lesson IDs for this course ──
        // This prevents any lesson IDs from other courses or other users'
        // contaminated localStorage from ever being saved into this enrollment.
        const courseDoc: any = await Course.findById(courseId).select('subjects sections').lean();
        const validLessonIds = new Set<string>();
        if (courseDoc) {
            const collectIds = (items: any[]) => {
                for (const item of items || []) {
                    if (item._id) validLessonIds.add(item._id.toString());
                }
            };
            for (const subject of courseDoc.subjects || []) {
                for (const section of subject.sections || []) {
                    for (const subsection of section.subsections || []) {
                        collectIds(subsection.content || []);
                    }
                }
            }
            for (const section of courseDoc.sections || []) {
                for (const subsection of section.subsections || []) {
                    collectIds(subsection.content || []);
                }
            }
        }

        const sanitizeLessons = (lessons: string[]): string[] => {
            if (!Array.isArray(lessons)) return [];
            if (validLessonIds.size === 0) return lessons; // no structure to validate against
            const safe = lessons.filter((id) => validLessonIds.has(id));
            if (safe.length !== lessons.length) {
                console.warn(
                    `⚠️  [progress] Filtered ${lessons.length - safe.length} invalid lessonId(s)` +
                    ` for user=${req.user?.id} course=${courseId}`
                );
            }
            return safe;
        };
        // ─────────────────────────────────────────────────────────────────────────

        // Find or create enrollment
        let enrollment = await Enrollment.findOne(enrollmentQuery);

        if (!enrollment) {
            // Fallback: find course-level enrollment
            enrollment = await Enrollment.findOne({ userId: req.user?.id, courseId, subjectId: null });
        }

        if (!enrollment) {
            const rawList = Array.isArray(completedLessons) ? completedLessons : [];
            const completedList = sanitizeLessons(rawList);
            let totalCourseLessons = 0;
            let completedCourseLessons = 0;
            const completedSet = new Set(completedList);

            if (courseDoc && courseDoc.subjects) {
                for (const subject of courseDoc.subjects) {
                    for (const section of subject.sections || []) {
                        for (const subsection of section.subsections || []) {
                            for (const item of subsection.content || []) {
                                totalCourseLessons++;
                                if (item._id && completedSet.has(item._id.toString())) {
                                    completedCourseLessons++;
                                }
                            }
                        }
                    }
                }
            }
            if (courseDoc && courseDoc.sections) {
                for (const section of courseDoc.sections) {
                    for (const subsection of section.subsections || []) {
                        for (const item of subsection.content || []) {
                            totalCourseLessons++;
                            if (item._id && completedSet.has(item._id.toString())) {
                                completedCourseLessons++;
                            }
                        }
                    }
                }
            }

            const overallPct = totalCourseLessons > 0 ? Math.round((completedCourseLessons / totalCourseLessons) * 100) : 0;

            enrollment = await Enrollment.create({
                userId: req.user?.id,
                courseId: courseId,
                subjectId: null,
                status: 'paid',
                completionPercentage: overallPct,
                completedLessons: completedList,
                purchaseDate: new Date(),
            });
        } else {
            if (Array.isArray(completedLessons)) {
                enrollment.completedLessons = sanitizeLessons(completedLessons);
            }

            if (enrollment.subjectId) {
                // Legacy per-subject enrollment
                enrollment.completionPercentage =
                    typeof completionPercentage === 'number'
                        ? completionPercentage
                        : enrollment.completionPercentage;
            } else {
                // Course-level enrollment: compute overall course progress
                const completedList = enrollment.completedLessons || [];
                let totalCourseLessons = 0;
                let completedCourseLessons = 0;
                const completedSet = new Set(completedList);

                if (courseDoc && courseDoc.subjects) {
                    for (const subject of courseDoc.subjects) {
                        for (const section of subject.sections || []) {
                            for (const subsection of section.subsections || []) {
                                for (const item of subsection.content || []) {
                                    totalCourseLessons++;
                                    if (item._id && completedSet.has(item._id.toString())) {
                                        completedCourseLessons++;
                                    }
                                }
                            }
                        }
                    }
                }
                if (courseDoc && courseDoc.sections) {
                    for (const section of courseDoc.sections) {
                        for (const subsection of section.subsections || []) {
                            for (const item of subsection.content || []) {
                                totalCourseLessons++;
                                if (item._id && completedSet.has(item._id.toString())) {
                                    completedCourseLessons++;
                                }
                            }
                        }
                    }
                }
                enrollment.completionPercentage = totalCourseLessons > 0 ? Math.round((completedCourseLessons / totalCourseLessons) * 100) : 0;
            }

            enrollment.updatedAt = new Date();
            await enrollment.save();
        }

        // Save completedLessons to User model
        if (completedLessons && Array.isArray(completedLessons)) {
            const { User } = await import('../models/User');
            const user = await User.findById(req.user?.id);

            if (user) {
                const courseProgressIndex = user.courseProgress?.findIndex(
                    (cp: any) => cp.courseId.toString() === courseId
                );

                if (courseProgressIndex !== undefined && courseProgressIndex >= 0) {
                    user.courseProgress[courseProgressIndex].completedLessons = sanitizeLessons(completedLessons);
                    user.courseProgress[courseProgressIndex].lastAccessed = new Date();
                } else {
                    if (!user.courseProgress) user.courseProgress = [];
                    user.courseProgress.push({
                        courseId: courseId,
                        completedLessons: sanitizeLessons(completedLessons),
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

        let enrollment = await Enrollment.findOne(enrollmentQuery);

        // Fallback to course-level enrollment
        if (!enrollment) {
            enrollment = await Enrollment.findOne({ userId: req.user?.id, courseId, subjectId: null });
        }

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

        const user = await User.findById(req.user?.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isEnrolled = user.enrolledCourses.some(
            (enrolledCourseId: any) => enrolledCourseId.toString() === courseId
        );

        if (!isEnrolled) {
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
