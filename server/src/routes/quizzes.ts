import { Router, Request, Response } from 'express';
import { Quiz } from '../models/Quiz';
import { QuizAttempt } from '../models/QuizAttempt';
import { QuizResult } from '../models/QuizResult';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { QuizCategory } from '../models/QuizCategory';
import { ensureDefaultCategoriesForCourse } from './quizCategories';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import mongoose from 'mongoose';

const router = Router();

// ==================== HELPERS ====================

/**
 * Sanitise quiz questions and marks (used for both draft and published saves).
 * Does NOT enforce required fields â€” that is done at publish-time only.
 */
function sanitizeQuizData(quizData: any) {
    const defaultMarks = Number(quizData.settings?.marksPerQuestion) || 4;
    const defaultNegative = Number(quizData.settings?.negativeMarking) || 0;

    if (Array.isArray(quizData.questions)) {
        quizData.questions = quizData.questions.map((q: any) => ({
            ...q,
            marks: defaultMarks,
            negativeMarks: defaultNegative,
        }));
        quizData.totalQuestions = quizData.questions.length;
    }
    return quizData;
}

/**
 * Strip HTML tags to check if a rich-text field is effectively empty.
 */
function isHtmlEmpty(html: string | undefined): boolean {
    if (!html) return true;
    if (html.includes('<img')) return false;
    return !html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Full publish-time validation. Returns { valid, errors }.
 * These exact same rules are checked on the frontend before calling publish,
 * and here on the server as the authoritative gate.
 */
function validateForPublish(quiz: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!quiz.title?.trim()) errors.push('Quiz title is required');
    if (!quiz.description?.trim()) errors.push('Quiz description is required');
    if (!quiz.courseId) errors.push('Course selection is required');
    if (!quiz.subjectId) errors.push('Subject selection is required');
    if (!quiz.categoryId) errors.push('Quiz Category selection is required');
    if (!quiz.settings?.marksPerQuestion || quiz.settings.marksPerQuestion <= 0)
        errors.push('Marks per question must be greater than 0');
    if (!quiz.settings?.timeLimit || quiz.settings.timeLimit <= 0)
        errors.push('Time limit must be greater than 0');
    if (!quiz.questions || quiz.questions.length === 0)
        errors.push('At least one question is required');

    (quiz.questions || []).forEach((q: any, i: number) => {
        const qNum = i + 1;
        if (isHtmlEmpty(q.questionText))
            errors.push(`Question ${qNum}: Question text is required`);

        if (q.questionType === 'match') {
            const pairs = q.matchPairs || [];
            if (pairs.length < 2)
                errors.push(`Question ${qNum}: At least 2 match pairs required`);
            if (pairs.some((p: any) => isHtmlEmpty(p.left) || isHtmlEmpty(p.right)))
                errors.push(`Question ${qNum}: All match pairs must have both left and right text`);
        } else {
            if (!q.options || q.options.length < 2)
                errors.push(`Question ${qNum}: At least 2 options required`);
            else if (q.options.some((opt: any) => isHtmlEmpty(opt.text)))
                errors.push(`Question ${qNum}: All options must have text`);
            if (!q.correctAnswer)
                errors.push(`Question ${qNum}: Correct answer must be selected`);
        }
        if (isHtmlEmpty(q.explanation))
            errors.push(`Question ${qNum}: Explanation is required`);
    });

    return { valid: errors.length === 0, errors };
}

/**
 * Build an audit log entry for the current admin user.
 */
function buildAuditEntry(req: AuthRequest, action: string, meta?: Record<string, any>) {
    return {
        action,
        adminId: new mongoose.Types.ObjectId(req.user?.id),
        adminName: req.user?.name || 'Admin',
        timestamp: new Date(),
        meta,
    };
}

// ==================== ADMIN ROUTES ====================

// @route   POST /api/quizzes
// @desc    Create a new quiz (draft or published)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, subjectId, categoryId, status = 'draft', draftMeta, ...rawBody } = req.body;
        const sanitized = sanitizeQuizData(rawBody);

        // Enforce Step 2 marksPerQuestion across all questions if specified
        const marksPerQ = Number(sanitized.settings?.marksPerQuestion);
        if (marksPerQ > 0 && Array.isArray(sanitized.questions)) {
            sanitized.questions.forEach((q: any) => {
                q.marks = marksPerQ;
            });
        }

        // If creating as published, run full validation first
        if (status === 'published') {
            const validation = validateForPublish({ ...sanitized, courseId, subjectId, categoryId });
            if (!validation.valid) {
                return res.status(400).json({ success: false, errors: validation.errors, message: validation.errors[0] });
            }
        }

        // Resolve course name and subject name
        let courseName = sanitized.courseName || '';
        let subjectName = sanitized.subjectName || '';

        if (courseId) {
            const course = await Course.findById(courseId);
            if (!course) throw new AppError('Course not found', 404);
            courseName = course.title;

            if (subjectId) {
                const sub = (course.subjects || []).find((s: any) => s._id.toString() === subjectId.toString());
                if (sub) {
                    subjectName = sub.name;
                }
            }
        }

        // Resolve category name
        let categoryName = sanitized.categoryName || '';
        if (categoryId) {
            const categoryDoc = await QuizCategory.findById(categoryId);
            if (categoryDoc) {
                categoryName = categoryDoc.name;
            }
        }

        const quiz = await Quiz.create({
            ...sanitized,
            courseId: courseId || undefined,
            courseName,
            subjectId: subjectId || undefined,
            subjectName,
            categoryId: categoryId || undefined,
            categoryName,
            createdBy: req.user?.id,
            status,
            draftMeta: draftMeta || { currentStep: 1, currentQuestionIndex: 0, autosaveCount: 0, isAutosaved: false },
            auditLog: [buildAuditEntry(req, 'created', { questionCount: sanitized.questions?.length || 0 })],
        });

        console.log(`[QUIZ CREATED] ID=${quiz._id} Status=${quiz.status} Questions=${quiz.questions.length}`);

        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/multi-course
// @desc    Create a quiz for multiple selected courses simultaneously (isolated per course)
// @access  Private (Admin)
router.post('/multi-course', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseIds, subjectName, categoryName, status = 'draft', draftMeta, ...rawBody } = req.body;

        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            throw new AppError('At least one course must be selected', 400);
        }
        if (!subjectName || !subjectName.trim()) {
            throw new AppError('Subject name is required for multi-course creation', 400);
        }

        const sanitized = sanitizeQuizData(rawBody);

        const marksPerQ = Number(sanitized.settings?.marksPerQuestion);
        if (marksPerQ > 0 && Array.isArray(sanitized.questions)) {
            sanitized.questions.forEach((q: any) => {
                q.marks = marksPerQ;
            });
        }

        const normSubjectName = subjectName.trim().toLowerCase();
        const normCategoryName = (categoryName || 'Basic').trim().toLowerCase();

        const createdQuizzes: any[] = [];
        const skippedCourses: Array<{ courseId: string; courseName: string; reason: string }> = [];

        for (const cId of courseIds) {
            const course = await Course.findById(cId);
            if (!course) {
                skippedCourses.push({ courseId: cId, courseName: 'Unknown', reason: 'Course not found' });
                continue;
            }

            // Find matching subject in this course
            const targetSubject = (course.subjects || []).find(
                (s: any) => s.name && s.name.trim().toLowerCase() === normSubjectName
            );

            if (!targetSubject) {
                skippedCourses.push({
                    courseId: cId,
                    courseName: course.title,
                    reason: `Subject "${subjectName}" does not exist in ${course.title}`,
                });
                continue;
            }

            // Duplicate prevention check (Section 19)
            const existingQuiz = await Quiz.findOne({
                courseId: course._id,
                subjectId: targetSubject._id,
                title: sanitized.title.trim(),
            });

            if (existingQuiz) {
                skippedCourses.push({
                    courseId: cId,
                    courseName: course.title,
                    reason: `A quiz titled "${sanitized.title.trim()}" already exists in ${course.title} → ${targetSubject.name}`,
                });
                continue;
            }

            // Ensure categories exist and resolve matching category
            await ensureDefaultCategoriesForCourse(course._id);
            let targetCategory = await QuizCategory.findOne({
                courseId: course._id,
                name: { $regex: new RegExp(`^${normCategoryName}$`, 'i') },
                $or: [{ subjectId: targetSubject._id }, { subjectId: null }, { subjectId: { $exists: false } }],
            });

            if (!targetCategory) {
                targetCategory = await QuizCategory.findOne({
                    courseId: course._id,
                    isActive: true,
                });
            }

            const targetCategoryId = targetCategory ? targetCategory._id : undefined;
            const targetCategoryName = targetCategory ? targetCategory.name : categoryName || 'Basic';

            // Validate if publishing
            if (status === 'published') {
                const validation = validateForPublish({
                    ...sanitized,
                    courseId: course._id,
                    subjectId: targetSubject._id,
                    categoryId: targetCategoryId,
                });
                if (!validation.valid) {
                    skippedCourses.push({
                        courseId: cId,
                        courseName: course.title,
                        reason: `Validation failed for ${course.title}: ${validation.errors[0]}`,
                    });
                    continue;
                }
            }

            const quiz = await Quiz.create({
                ...sanitized,
                courseId: course._id,
                courseName: course.title,
                subjectId: targetSubject._id,
                subjectName: targetSubject.name,
                categoryId: targetCategoryId,
                categoryName: targetCategoryName,
                createdBy: req.user?.id,
                status,
                draftMeta: draftMeta || { currentStep: 1, currentQuestionIndex: 0, autosaveCount: 0, isAutosaved: false },
                auditLog: [buildAuditEntry(req, 'created', { questionCount: sanitized.questions?.length || 0, multiCourse: true })],
            });

            createdQuizzes.push(quiz);
        }

        res.status(201).json({
            success: true,
            createdCount: createdQuizzes.length,
            createdQuizzes,
            skippedCourses,
            message: `Quiz created for ${createdQuizzes.length} course(s).${skippedCourses.length > 0 ? ` (${skippedCourses.length} skipped)` : ''}`,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/copy-to-courses
// @desc    Copy an existing quiz to selected target courses (with complete attempt isolation)
// @access  Private (Admin)
router.post('/:id/copy-to-courses', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { targetCourseIds } = req.body;
        if (!Array.isArray(targetCourseIds) || targetCourseIds.length === 0) {
            throw new AppError('At least one target course is required', 400);
        }

        const sourceQuiz = await Quiz.findById(req.params.id);
        if (!sourceQuiz) throw new AppError('Source quiz not found', 404);

        const normSubjectName = (sourceQuiz.subjectName || '').trim().toLowerCase();
        const normCategoryName = (sourceQuiz.categoryName || 'Basic').trim().toLowerCase();

        const createdQuizzes: any[] = [];
        const skippedCourses: Array<{ courseId: string; courseName: string; reason: string }> = [];

        for (const cId of targetCourseIds) {
            if (sourceQuiz.courseId && sourceQuiz.courseId.toString() === cId.toString()) {
                skippedCourses.push({ courseId: cId, courseName: sourceQuiz.courseName, reason: 'Already the source course' });
                continue;
            }

            const course = await Course.findById(cId);
            if (!course) {
                skippedCourses.push({ courseId: cId, courseName: 'Unknown', reason: 'Course not found' });
                continue;
            }

            // Find matching subject by name
            const targetSubject = (course.subjects || []).find(
                (s: any) => s.name && s.name.trim().toLowerCase() === normSubjectName
            );

            if (!targetSubject) {
                skippedCourses.push({
                    courseId: cId,
                    courseName: course.title,
                    reason: `Subject "${sourceQuiz.subjectName}" does not exist in ${course.title}`,
                });
                continue;
            }

            // Duplicate prevention check
            const existingQuiz = await Quiz.findOne({
                courseId: course._id,
                subjectId: targetSubject._id,
                title: sourceQuiz.title.trim(),
            });

            if (existingQuiz) {
                skippedCourses.push({
                    courseId: cId,
                    courseName: course.title,
                    reason: `A quiz titled "${sourceQuiz.title.trim()}" already exists in ${course.title} → ${targetSubject.name}`,
                });
                continue;
            }

            await ensureDefaultCategoriesForCourse(course._id);
            let targetCategory = await QuizCategory.findOne({
                courseId: course._id,
                name: { $regex: new RegExp(`^${normCategoryName}$`, 'i') },
                $or: [{ subjectId: targetSubject._id }, { subjectId: null }, { subjectId: { $exists: false } }],
            });

            if (!targetCategory) {
                targetCategory = await QuizCategory.findOne({
                    courseId: course._id,
                    isActive: true,
                });
            }

            const quizData = sourceQuiz.toObject();
            delete quizData._id;
            delete quizData.createdAt;
            delete quizData.updatedAt;
            delete quizData.lockedBy;

            const newQuiz = await Quiz.create({
                ...quizData,
                courseId: course._id,
                courseName: course.title,
                subjectId: targetSubject._id,
                subjectName: targetSubject.name,
                categoryId: targetCategory ? targetCategory._id : undefined,
                categoryName: targetCategory ? targetCategory.name : sourceQuiz.categoryName,
                createdBy: req.user?.id,
                auditLog: [buildAuditEntry(req, 'created', { copiedFromQuizId: sourceQuiz._id, fromCourse: sourceQuiz.courseName })],
            });

            createdQuizzes.push(newQuiz);
        }

        res.status(201).json({
            success: true,
            createdCount: createdQuizzes.length,
            createdQuizzes,
            skippedCourses,
            message: `Quiz copied to ${createdQuizzes.length} course(s).${skippedCourses.length > 0 ? ` (${skippedCourses.length} skipped)` : ''}`,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes
// @desc    Get all quizzes (admin) â€” filterable by status
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const { courseId, subjectId, categoryId, status, isPublished } = req.query;

        const filter: any = {};
        if (courseId) filter.courseId = courseId;
        if (subjectId) filter.subjectId = subjectId;
        if (categoryId) filter.categoryId = categoryId;

        // Support new ?status= param as well as old ?isPublished= for compatibility
        if (status && status !== 'all') {
            filter.status = status;
        } else if (isPublished !== undefined && status === undefined) {
            filter.status = isPublished === 'true' ? 'published' : { $in: ['draft', 'archived'] };
        }

        const quizzes = await Quiz.find(filter)
            .select('-questions -auditLog') // lightweight list â€” omit heavy arrays
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/:id/admin
// @desc    Get quiz by ID (admin view â€” full details)
// @access  Private (Admin)
router.get('/:id/admin', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('courseId');
        if (!quiz) throw new AppError('Quiz not found', 404);
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/quizzes/:id
// @desc    Update a quiz (draft save / autosave / full edit)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { status: newStatus, categoryId, subjectId, draftMeta, autosave, ...rawBody } = req.body;
        const sanitized = sanitizeQuizData(rawBody);

        const existing = await Quiz.findById(req.params.id);
        if (!existing) throw new AppError('Quiz not found', 404);

        // Enforce Step 2 marksPerQuestion across all questions if specified
        const marksPerQ = Number(sanitized.settings?.marksPerQuestion || existing.settings?.marksPerQuestion);
        if (marksPerQ > 0 && Array.isArray(sanitized.questions)) {
            sanitized.questions.forEach((q: any) => {
                q.marks = marksPerQ;
            });
        }

        const effectiveCourseId = sanitized.courseId || existing.courseId?.toString();
        const effectiveSubjectId = subjectId !== undefined ? subjectId : sanitized.subjectId || existing.subjectId?.toString();
        const effectiveCategoryId = categoryId !== undefined ? categoryId : sanitized.categoryId || existing.categoryId?.toString();

        // If attempting to change status to published, run full validation
        if (newStatus === 'published' && existing.status !== 'published') {
            const validation = validateForPublish({
                ...existing.toObject(),
                ...sanitized,
                courseId: effectiveCourseId,
                subjectId: effectiveSubjectId,
                categoryId: effectiveCategoryId,
            });
            if (!validation.valid) {
                return res.status(400).json({ success: false, errors: validation.errors, message: validation.errors[0] });
            }
        }

        // Resolve course name and subject name if changed
        let courseName = sanitized.courseName || existing.courseName;
        let subjectName = sanitized.subjectName || existing.subjectName;

        if (effectiveCourseId) {
            const course = await Course.findById(effectiveCourseId);
            if (course) {
                courseName = course.title;
                if (effectiveSubjectId) {
                    const sub = (course.subjects || []).find((s: any) => s._id.toString() === effectiveSubjectId.toString());
                    if (sub) subjectName = sub.name;
                }
            }
        }

        // Resolve category name if categoryId changed/supplied
        let categoryName = sanitized.categoryName || existing.categoryName;
        if (effectiveCategoryId !== undefined) {
            if (effectiveCategoryId) {
                const categoryDoc = await QuizCategory.findById(effectiveCategoryId);
                categoryName = categoryDoc?.name || '';
            } else {
                categoryName = '';
            }
        }

        // Build updated draftMeta
        const updatedDraftMeta = {
            ...existing.draftMeta?.toObject?.() || existing.draftMeta || {},
            ...(draftMeta || {}),
            lastAutosavedAt: new Date(),
            autosaveCount: (existing.draftMeta?.autosaveCount || 0) + 1,
            isAutosaved: true,
        };

        // Build audit entry
        const auditAction = autosave ? 'autosaved' : (newStatus === 'published' ? 'published' : 'edited');
        const newAuditEntry = buildAuditEntry(req as AuthRequest, auditAction, {
            questionCount: sanitized.questions?.length ?? existing.questions.length,
            step: draftMeta?.currentStep,
        });

        const updatePayload: any = {
            ...sanitized,
            courseName,
            subjectName,
            categoryName,
            draftMeta: updatedDraftMeta,
            $push: { auditLog: newAuditEntry },
        };
        if (effectiveSubjectId !== undefined) {
            updatePayload.subjectId = effectiveSubjectId || null;
        }
        if (effectiveCategoryId !== undefined) {
            updatePayload.categoryId = effectiveCategoryId || null;
        }
        if (newStatus) updatePayload.status = newStatus;

        // Use findByIdAndUpdate with runValidators:false so partial drafts pass
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: false }
        );

        if (!quiz) throw new AppError('Quiz not found', 404);

        console.log(`[QUIZ UPDATED] ID=${quiz._id} Status=${quiz.status} Questions=${quiz.questions.length} Autosave=${!!autosave}`);

        // For autosave, return lightweight response to reduce payload
        if (autosave) {
            return res.status(200).json({
                success: true,
                data: {
                    _id: quiz._id,
                    status: quiz.status,
                    draftMeta: quiz.draftMeta,
                    updatedAt: quiz.updatedAt,
                },
            });
        }

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz and all its attempts/results
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);
        await QuizAttempt.deleteMany({ quizId: quiz._id });
        await QuizResult.deleteMany({ quizId: quiz._id });
        res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/publish
// @desc    Publish a quiz (full validation enforced)
// @access  Private (Admin)
router.post('/:id/publish', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);

        const { isPublished } = req.body;

        if (isPublished) {
            // Run full publish validation
            const validation = validateForPublish(quiz.toObject());
            if (!validation.valid) {
                return res.status(400).json({ success: false, errors: validation.errors, message: validation.errors[0] });
            }
            quiz.status = 'published';
        } else {
            // Unpublish = revert to draft
            quiz.status = 'draft';
        }

        // Clear lock on publish
        quiz.lockedBy = undefined;

        (quiz.auditLog as any[]).push(buildAuditEntry(req, isPublished ? 'published' : 'edited'));
        await quiz.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: quiz,
            message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/archive
// @desc    Archive a quiz (hidden from students, kept for history)
// @access  Private (Admin)
router.post('/:id/archive', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);

        quiz.status = 'archived';
        quiz.lockedBy = undefined;
        (quiz.auditLog as any[]).push(buildAuditEntry(req, 'archived'));
        await quiz.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, data: quiz, message: 'Quiz archived successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/restore
// @desc    Restore an archived quiz back to draft
// @access  Private (Admin)
router.post('/:id/restore', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);

        quiz.status = 'draft';
        (quiz.auditLog as any[]).push(buildAuditEntry(req, 'restored'));
        await quiz.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, data: quiz, message: 'Quiz restored to draft' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/lock
// @desc    Acquire an edit lock (concurrency control)
// @access  Private (Admin)
router.post('/:id/lock', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).select('lockedBy');
        if (!quiz) throw new AppError('Quiz not found', 404);

        const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        const lock = quiz.lockedBy;

        // Check if locked by a DIFFERENT admin and the lock is still fresh
        if (
            lock &&
            lock.adminId.toString() !== req.user?.id &&
            now - new Date(lock.lockedAt).getTime() < LOCK_TTL_MS
        ) {
            return res.status(409).json({
                success: false,
                message: `Quiz is being edited by ${lock.adminName}`,
                lockedBy: lock,
            });
        }

        // Acquire / refresh lock
        await Quiz.findByIdAndUpdate(req.params.id, {
            lockedBy: {
                adminId: new mongoose.Types.ObjectId(req.user?.id),
                adminName: req.user?.name || 'Admin',
                lockedAt: new Date(),
            },
        });

        res.status(200).json({ success: true, message: 'Lock acquired' });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/quizzes/:id/lock
// @desc    Release an edit lock
// @access  Private (Admin)
router.delete('/:id/lock', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        await Quiz.findByIdAndUpdate(req.params.id, { $unset: { lockedBy: 1 } });
        res.status(200).json({ success: true, message: 'Lock released' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/repair-marks
// @desc    Fix all questions in a quiz whose marks don't match settings
// @access  Private (Admin)
router.post('/:id/repair-marks', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);

        const targetMarks = Number(quiz.settings?.marksPerQuestion) || 4;
        const targetNegative = Number(quiz.settings?.negativeMarking) || 0;
        let fixedCount = 0;

        quiz.questions = quiz.questions.map((q: any) => {
            const needsFix = !(typeof q.marks === 'number' && !isNaN(q.marks) && q.marks > 0 && q.marks === targetMarks);
            if (needsFix) { q.marks = targetMarks; fixedCount++; }
            if (typeof q.negativeMarks !== 'number' || isNaN(q.negativeMarks)) {
                q.negativeMarks = targetNegative;
            }
            return q;
        }) as any;

        if (fixedCount > 0) await quiz.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `Repaired ${fixedCount} question(s). All questions now have marks = ${targetMarks}.`,
            data: { fixedCount, totalQuestions: quiz.questions.length, targetMarks },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/:id/results
// @desc    Get all student results for a quiz
// @access  Private (Admin)
router.get('/:id/results', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const results = await QuizResult.find({ quizId: req.params.id })
            .sort({ marksObtained: -1, timeTaken: 1 })
            .populate('studentId', 'name email');

        const stats = {
            totalAttempts: results.length,
            averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length : 0,
            averagePercentage: results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0,
            highestScore: results.length > 0 ? Math.max(...results.map((r) => r.marksObtained)) : 0,
            lowestScore: results.length > 0 ? Math.min(...results.map((r) => r.marksObtained)) : 0,
            passRate: results.length > 0 ? (results.filter((r) => r.isPassed).length / results.length) * 100 : 0,
        };

        res.status(200).json({ success: true, count: results.length, stats, data: results });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/:id/analytics
// @desc    Get quiz analytics
// @access  Private (Admin)
router.get('/:id/analytics', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) throw new AppError('Quiz not found', 404);

        const results = await QuizResult.find({ quizId: req.params.id });

        const questionAnalysis = quiz.questions.map((question: any) => {
            const questionResults = results.flatMap((r: any) =>
                r.questionResults.filter((qr: any) => qr.questionId.toString() === question._id?.toString())
            );
            const correctCount = questionResults.filter((qr) => qr.isCorrect).length;
            const totalAttempts = questionResults.length;
            return {
                questionId: question._id,
                questionText: question.questionText.substring(0, 100),
                correctRate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
                totalAttempts,
                correctCount,
                incorrectCount: totalAttempts - correctCount,
            };
        });

        const scoreRanges: Record<string, number> = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
        results.forEach((result) => {
            if (result.percentage <= 25) scoreRanges['0-25']++;
            else if (result.percentage <= 50) scoreRanges['26-50']++;
            else if (result.percentage <= 75) scoreRanges['51-75']++;
            else scoreRanges['76-100']++;
        });

        res.status(200).json({
            success: true,
            data: { questionAnalysis, scoreDistribution: scoreRanges, totalAttempts: results.length },
        });
    } catch (error) {
        next(error);
    }
});

// ==================== STUDENT ROUTES ====================


// @route   GET /api/quizzes/available
// @desc    Get available quizzes for enrolled courses
// @access  Private (Student)
// â”€â”€â”€ Helper: Verify quiz access for user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const canAccessQuiz = async (user: any, quiz: any): Promise<boolean> => {
    // 1. Admins and Teachers have access to all quizzes
    if (user.role === 'admin' || user.role === 'teacher') {
        return true;
    }

    // 2. Fetch course details
    const course = await Course.findById(quiz.courseId);
    if (!course) return false;

    // 3. Free course (price === 0 or paymentEnabled === false) -> accessible to all logged-in students
    if (course.price === 0 || !course.paymentEnabled) {
        return true;
    }

    // 4. Check if courseId is present in user.enrolledCourses array
    const isEnrolledInUserDoc = (user.enrolledCourses || []).some(
        (id: any) => id.toString() === quiz.courseId.toString()
    );
    if (isEnrolledInUserDoc) {
        return true;
    }

    // 5. Check Enrollment collection (paid status + course-level OR matching subject)
    const enrollmentQuery: any = {
        userId: user._id,
        courseId: quiz.courseId,
        status: 'paid',
    };

    if (quiz.subjectId) {
        enrollmentQuery.$or = [
            { subjectId: quiz.subjectId },
            { subjectId: null },
            { subjectId: { $exists: false } },
        ];
    }

    const enrollment = await Enrollment.findOne(enrollmentQuery);
    return !!enrollment;
};

// @route   GET /api/quizzes/available
// @desc    Get available quizzes for enrolled courses
// @access  Private (Student)
router.get('/available/my', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const { courseId, subjectId, categoryId } = req.query;
        let quizzes: any[] = [];

        const extraFilters: any = {};
        if (courseId) extraFilters.courseId = courseId;
        if (subjectId) extraFilters.subjectId = subjectId;
        if (categoryId) extraFilters.categoryId = categoryId;

        const publishedFilter = {
            $or: [{ status: 'published' }, { isPublished: true }],
        };

        if (user.role === 'admin' || user.role === 'teacher') {
            quizzes = await Quiz.find({ ...publishedFilter, ...extraFilters }).select('-questions');
        } else {
            // Get all paid enrollments
            const enrollments = await Enrollment.find({ userId: user._id, status: 'paid' });
            
            // Get free courses
            const freeCourses = await Course.find({
                $or: [{ price: 0 }, { paymentEnabled: false }]
            }).select('_id');

            const enrolledCourseIds = new Set<string>();
            enrollments.forEach((e) => {
                if (e.courseId) {
                    const idStr = typeof e.courseId === 'object' && (e.courseId as any)._id
                        ? (e.courseId as any)._id.toString()
                        : e.courseId.toString();
                    enrolledCourseIds.add(idStr);
                }
            });
            (user.enrolledCourses || []).forEach((cId: any) => {
                if (cId) {
                    const idStr = typeof cId === 'object' && cId._id ? cId._id.toString() : cId.toString();
                    enrolledCourseIds.add(idStr);
                }
            });
            freeCourses.forEach((c) => enrolledCourseIds.add(c._id.toString()));

            if (enrolledCourseIds.size === 0) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    data: [],
                });
            }

            // If courseId filter is explicitly provided, verify student has access to it
            let finalCourseIds = Array.from(enrolledCourseIds);
            if (courseId && typeof courseId === 'string') {
                if (!enrolledCourseIds.has(courseId)) {
                    return res.status(200).json({ success: true, count: 0, data: [] });
                }
                finalCourseIds = [courseId];
            }

            const queryCourseObjectIds = finalCourseIds.map(
                (id) => new mongoose.Types.ObjectId(id)
            );

            quizzes = await Quiz.find({
                courseId: { $in: queryCourseObjectIds },
                ...publishedFilter,
                ...extraFilters,
            }).select('-questions');
        }

        // Get user's attempts for these quizzes
        const attempts = await QuizAttempt.find({
            studentId: user._id,
            quizId: { $in: quizzes.map((q) => q._id) },
        });

        // Get user's results
        const results = await QuizResult.find({
            studentId: user._id,
            quizId: { $in: quizzes.map((q) => q._id) },
        });

        // Combine data
        const quizzesWithStatus = quizzes.map((quiz) => {
            const quizAttempts = attempts.filter((a) => a.quizId.toString() === quiz._id.toString());
            const quizResults = results
                .filter((r) => r.quizId.toString() === quiz._id.toString())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // newest first
            const inProgressAttempt = quizAttempts.find((a) => a.status === 'in-progress');

            // Build compact history list for the attempt picker
            const allAttempts = quizResults.map((r: any, i: number) => ({
                attemptId: r.attemptId?.toString() || '',
                resultId: r._id?.toString() || '',
                attemptNumber: quizResults.length - i, // newest = highest number
                marksObtained: r.marksObtained,
                totalMarks: r.totalMarks,
                percentage: r.percentage,
                isPassed: r.isPassed,
                timeTaken: r.timeTaken,
                attemptDate: r.createdAt,
            }));

            return {
                ...quiz.toObject(),
                attemptCount: quizAttempts.length,
                status: inProgressAttempt ? 'in-progress' : quizResults.length > 0 ? 'completed' : 'not-attempted',
                lastScore: quizResults.length > 0 ? quizResults[0].marksObtained : null,
                lastPercentage: quizResults.length > 0 ? quizResults[0].percentage : null,
                inProgressAttemptId: inProgressAttempt?._id,
                allAttempts,
            };
        });

        res.status(200).json({
            success: true,
            count: quizzesWithStatus.length,
            data: quizzesWithStatus,
        });
    } catch (error) {
        next(error);
    }
});

// Helper: sanitize quiz for student responses (normalizes questions, options, matchPairs, hides correct answers)
function sanitizeQuizForStudent(quiz: any) {
    const qObj = quiz.toObject ? quiz.toObject() : JSON.parse(JSON.stringify(quiz));

    // Use quiz-level marksPerQuestion as the fallback for any question that lacks its own marks value
    const quizLevelMarks = typeof qObj.settings?.marksPerQuestion === 'number' && qObj.settings.marksPerQuestion > 0
        ? qObj.settings.marksPerQuestion
        : 4;
    const quizLevelNegative = typeof qObj.settings?.negativeMarking === 'number'
        ? qObj.settings.negativeMarking
        : 0;

    qObj.questions = (qObj.questions || []).map((q: any, idx: number) => {
        // Normalize options array
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const normalizedOptions = rawOptions.map((opt: any, oIdx: number) => {
            if (typeof opt === 'string') {
                return { id: String(oIdx + 1), text: opt };
            }
            if (opt && typeof opt === 'object') {
                return {
                    id: String(opt.id || opt._id || oIdx + 1),
                    text: String(opt.text || opt.value || opt.label || ''),
                    imageUrl: opt.imageUrl || undefined,
                };
            }
            return { id: String(oIdx + 1), text: String(opt || '') };
        });

        // Normalize matchPairs array
        const rawMatchPairs = Array.isArray(q.matchPairs) ? q.matchPairs : [];
        const normalizedMatchPairs = rawMatchPairs.map((p: any, pIdx: number) => ({
            id: String(p.id || p._id || `pair_${pIdx + 1}`),
            left: String(p.left || ''),
            right: String(p.right || ''),
            order: typeof p.order === 'number' ? p.order : pIdx,
        }));

        // Use question-level marks if valid and > 0; otherwise fall back to quiz-level marksPerQuestion
        const marks = typeof q.marks === 'number' && !isNaN(q.marks) && q.marks > 0
            ? q.marks
            : quizLevelMarks;

        return {
            _id: q._id ? q._id.toString() : `q_${idx}_${Date.now()}`,
            questionType: q.questionType || 'text',
            questionText: q.questionText || '',
            questionImage: q.questionImage || undefined,
            questionFormula: q.questionFormula || undefined,
            questionDiagram: q.questionDiagram || undefined,
            options: normalizedOptions,
            matchPairs: normalizedMatchPairs,
            explanation: q.explanation || '',
            marks,
            negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : quizLevelNegative,
            order: typeof q.order === 'number' ? q.order : idx,
        };
    });

    return qObj;
}

// @route   GET /api/quizzes/:id/preview
// @desc    Get quiz details for student preview (rules, settings, previous attempts)
// @access  Private (Student)
router.get('/:id/preview', protect, async (req: AuthRequest, res: Response, next) => {
    try {

        console.log(`[QUIZ API SERVER] GET Preview quizId: ${req.params.id}, userId: ${req.user?.id}`);
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        if (!quiz.isPublished) {
            throw new AppError('Quiz is not published yet', 403);
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const hasAccess = await canAccessQuiz(user, quiz);
        if (!hasAccess) {
            throw new AppError('You must be enrolled in the course to access this quiz', 403);
        }

        const attempts = await QuizAttempt.find({
            quizId: quiz._id,
            studentId: user._id,
        }).sort({ createdAt: -1 });

        const results = await QuizResult.find({
            quizId: quiz._id,
            studentId: user._id,
        }).sort({ createdAt: -1 });

        const sanitized = sanitizeQuizForStudent(quiz);

        res.status(200).json({
            success: true,
            data: {
                quiz: sanitized,
                attempts: attempts.length,
                completedAttempts: results.length,
                previousResults: results,
                canAttempt: !quiz.settings.allowRetake ? results.length === 0 : quiz.settings.maxAttempts ? results.length < quiz.settings.maxAttempts : true,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/start
// @desc    Start a quiz attempt
// @access  Private (Student)
router.post('/:id/start', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        console.log(`[QUIZ API SERVER] POST Start attempt quizId: ${req.params.id}, userId: ${req.user?.id}`);
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        if (!quiz.isPublished) {
            throw new AppError('Quiz is not published yet', 403);
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const hasAccess = await canAccessQuiz(user, quiz);
        if (!hasAccess) {
            throw new AppError('You must be enrolled in the course to attempt this quiz', 403);
        }

        const sanitized = sanitizeQuizForStudent(quiz);

        // Check for existing in-progress attempt
        const existingAttempt = await QuizAttempt.findOne({
            quizId: quiz._id,
            studentId: user._id,
            status: 'in-progress',
        });

        if (existingAttempt) {
            return res.status(200).json({
                success: true,
                data: {
                    attemptId: existingAttempt._id,
                    quiz: sanitized,
                    startedAt: existingAttempt.startedAt,
                },
            });
        }

        const completedAttempts = await QuizResult.countDocuments({
            quizId: quiz._id,
            studentId: user._id,
        });

        if (!quiz.settings.allowRetake && completedAttempts > 0) {
            throw new AppError('You have already attempted this quiz', 403);
        }

        if (quiz.settings.maxAttempts && completedAttempts >= quiz.settings.maxAttempts) {
            throw new AppError(`Maximum attempts (${quiz.settings.maxAttempts}) reached`, 403);
        }

        const attempt = await QuizAttempt.create({
            quizId: quiz._id,
            studentId: user._id,
            studentName: user.name,
            studentEmail: user.email,
            status: 'in-progress',
            startedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.status(201).json({
            success: true,
            data: {
                attemptId: attempt._id,
                quiz: sanitized,
                startedAt: attempt.startedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});


// @route   PUT /api/quizzes/attempts/:attemptId/answer
// @desc    Save/update answer for a question
// @access  Private (Student)
router.put('/attempts/:attemptId/answer', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { questionId, selectedAnswer } = req.body;

        const attempt = await QuizAttempt.findById(req.params.attemptId);

        if (!attempt) {
            throw new AppError('Attempt not found', 404);
        }

        if (attempt.studentId.toString() !== req.user?.id) {
            throw new AppError('Unauthorized', 403);
        }

        if (attempt.status !== 'in-progress') {
            throw new AppError('Cannot modify a completed attempt', 400);
        }

        // Check if time limit exceeded
        const quiz = await Quiz.findById(attempt.quizId);
        if (quiz) {
            const timeElapsed = (Date.now() - attempt.startedAt.getTime()) / 1000 / 60; // minutes
            if (timeElapsed > quiz.settings.timeLimit) {
                attempt.status = 'expired';
                await attempt.save();
                throw new AppError('Time limit exceeded', 400);
            }
        }

        // Update or add answer
        const existingAnswerIndex = attempt.answers.findIndex((a: any) => a.questionId.toString() === questionId);

        if (existingAnswerIndex >= 0) {
            attempt.answers[existingAnswerIndex].selectedAnswer = selectedAnswer;
        } else {
            attempt.answers.push({
                questionId: new mongoose.Types.ObjectId(questionId),
                selectedAnswer,
            });
        }

        await attempt.save();

        res.status(200).json({
            success: true,
            message: 'Answer saved',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/attempts/:attemptId/submit
// @desc    Submit quiz for evaluation
// @access  Private (Student)
router.post('/attempts/:attemptId/submit', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        console.log(`[QUIZ SUBMIT] attemptId=${req.params.attemptId} userId=${req.user?.id}`);
        const attempt = await QuizAttempt.findById(req.params.attemptId);

        if (!attempt) {
            throw new AppError('Attempt not found', 404);
        }

        if (attempt.studentId.toString() !== req.user?.id) {
            throw new AppError('Unauthorized', 403);
        }

        // â”€â”€ GRACEFUL DUPLICATE-SUBMIT RECOVERY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // If the attempt is already completed (duplicate tap / timer race / network retry),
        // do NOT throw an error. Instead, return the existing result so the frontend
        // can navigate directly to the Result Screen.
        if (attempt.status !== 'in-progress') {
            console.log(`[QUIZ SUBMIT] Attempt ${attempt._id} already ${attempt.status}. Looking up existing resultâ€¦`);
            const existingResult = await QuizResult.findOne({ attemptId: attempt._id });

            if (existingResult) {
                console.log(`[QUIZ SUBMIT] Returning existing resultId=${existingResult._id}`);
                return res.status(200).json({
                    success: true,
                    alreadySubmitted: true,
                    message: 'You have already completed this quiz. Opening your resultâ€¦',
                    data: {
                        resultId: existingResult._id,
                        attemptId: attempt._id,
                        marksObtained: existingResult.marksObtained,
                        totalMarks: existingResult.totalMarks,
                        correctAnswers: existingResult.correctAnswers,
                        incorrectAnswers: existingResult.incorrectAnswers,
                        unansweredQuestions: existingResult.unansweredQuestions,
                        percentage: existingResult.percentage,
                        isPassed: existingResult.isPassed,
                        timeTaken: existingResult.timeTaken,
                        rank: existingResult.rank,
                        feedback: existingResult.feedback,
                        questionResults: existingResult.questionResults,
                    },
                });
            }

            // Result not yet created (edge case: attempt marked completed but result write failed)
            // Fall through to re-calculate and save result below.
            console.log(`[QUIZ SUBMIT] No existing result found for completed attempt. Re-calculatingâ€¦`);
        }

        // Get quiz details
        const quiz = await Quiz.findById(attempt.quizId);
        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        // Mark attempt as completed
        attempt.status = 'completed';
        attempt.submittedAt = new Date();
        await attempt.save();

        // Evaluate answers
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let unansweredQuestions = 0;
        let marksObtained = 0;
        let totalMarks = 0;

        const defaultMarks = Number(quiz.settings?.marksPerQuestion) || 4;
        const defaultNegative = Number(quiz.settings?.negativeMarking) || 0;

        const questionResults = quiz.questions.map((question: any, idx: number) => {
            const studentAnswer = attempt.answers.find((a: any) => a.questionId.toString() === question._id?.toString());

            const marks = typeof question.marks === 'number' && !isNaN(question.marks) && question.marks > 0
                ? question.marks
                : defaultMarks;

            const negativeMarks = typeof question.negativeMarks === 'number' && !isNaN(question.negativeMarks) && question.negativeMarks >= 0
                ? question.negativeMarks
                : defaultNegative;

            // Total marks = sum of max potential marks for EVERY question
            totalMarks += marks;

            if (!studentAnswer || !studentAnswer.selectedAnswer) {
                unansweredQuestions++;
                console.log(`[QUESTION EVAL #${idx + 1}] Q_ID: ${question._id} | Type: ${question.questionType} | Base Marks: ${marks} | Correct: "${question.correctAnswer}" | Student: [SKIPPED] | Awarded: 0`);
                return {
                    questionId: question._id!,
                    questionText: question.questionText,
                    selectedAnswer: '',
                    correctAnswer: question.questionType === 'match' ? 'match' : question.correctAnswer,
                    isCorrect: false,
                    marksAwarded: 0,
                    explanation: question.explanation,
                };
            }

            // â”€â”€ Match the Following scoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (question.questionType === 'match') {
                const pairs: { left: string; right: string }[] = question.matchPairs || [];
                let correctPairs = 0;

                try {
                    const mapping: Record<string, string> = JSON.parse(studentAnswer.selectedAnswer || '{}');
                    pairs.forEach((pair, leftIdx) => {
                        const selectedRightIdx = parseInt(mapping[String(leftIdx)], 10);
                        const correctRightItem = pair.right;
                        const selectedRightItem = pairs[selectedRightIdx]?.right;
                        if (selectedRightItem === correctRightItem) correctPairs++;
                    });
                } catch {
                    // malformed answer â€” 0 correct pairs
                }

                const pairMarks = pairs.length > 0 ? marks / pairs.length : 0;
                const awarded = Math.round(correctPairs * pairMarks * 10) / 10;
                const isFullyCorrect = correctPairs === pairs.length;

                if (isFullyCorrect) correctAnswers++;
                else incorrectAnswers++;

                marksObtained += awarded;

                console.log(`[QUESTION EVAL #${idx + 1}] Q_ID: ${question._id} | Type: match | Base Marks: ${marks} | CorrectPairs: ${correctPairs}/${pairs.length} | Awarded: ${awarded}`);

                return {
                    questionId: question._id!,
                    questionText: question.questionText,
                    selectedAnswer: studentAnswer.selectedAnswer,
                    correctAnswer: 'match',
                    isCorrect: isFullyCorrect,
                    marksAwarded: awarded,
                    explanation: question.explanation,
                };
            }

            // â”€â”€ Standard MCQ scoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const isCorrect = studentAnswer.selectedAnswer === question.correctAnswer;
            const awardedMarks = isCorrect ? marks : -negativeMarks;

            if (isCorrect) {
                correctAnswers++;
                marksObtained += marks;
            } else {
                incorrectAnswers++;
                marksObtained -= negativeMarks;
            }

            console.log(`[QUESTION EVAL #${idx + 1}] Q_ID: ${question._id} | Type: ${question.questionType} | Base Marks: ${marks} | Correct: "${question.correctAnswer}" | Student: "${studentAnswer.selectedAnswer}" | Result: ${isCorrect ? 'CORRECT' : 'WRONG'} | Awarded: ${awardedMarks}`);

            return {
                questionId: question._id!,
                questionText: question.questionText,
                selectedAnswer: studentAnswer.selectedAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                marksAwarded: awardedMarks,
                explanation: question.explanation,
            };
        });

        // Ensure marksObtained is not negative
        marksObtained = Math.max(0, marksObtained);

        const totalQuestions = quiz.questions.length;
        const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
        const isPassed = percentage >= (quiz.settings?.passingPercentage || 40);

        console.log(`[QUIZ EVAL COMPLETE] quizId=${quiz._id} | totalQuestions=${totalQuestions} | totalMarks=${totalMarks} | obtainedMarks=${marksObtained} | correct=${correctAnswers} | wrong=${incorrectAnswers} | skipped=${unansweredQuestions} | percentage=${percentage.toFixed(2)}%`);

        // Create result
        const result = await QuizResult.create({
            attemptId: attempt._id,
            quizId: quiz._id,
            quizTitle: quiz.title,
            studentId: attempt.studentId,
            studentName: attempt.studentName,
            studentEmail: attempt.studentEmail,
            courseId: quiz.courseId,
            courseName: quiz.courseName,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            unansweredQuestions,
            totalMarks,
            marksObtained,
            percentage,
            isPassed,
            timeTaken: attempt.timeTaken || 0,
            questionResults,
        });

        // Calculate rank
        const allResults = await QuizResult.find({ quizId: quiz._id }).sort({ marksObtained: -1, timeTaken: 1 });

        allResults.forEach((r, index) => {
            r.rank = index + 1;
        });

        await Promise.all(allResults.map((r) => r.save()));

        console.log(`[QUIZ SUBMIT] Result saved. resultId=${result._id} score=${marksObtained}/${totalMarks} (${percentage.toFixed(1)}%)`);

        res.status(200).json({
            success: true,
            alreadySubmitted: false,
            message: 'Quiz submitted successfully',
            data: {
                resultId: result._id,
                attemptId: attempt._id,
                marksObtained,
                totalMarks,
                correctAnswers,
                incorrectAnswers,
                unansweredQuestions,
                percentage,
                isPassed,
                timeTaken: attempt.timeTaken || 0,
                rank: result.rank,
                feedback: result.feedback,
                questionResults,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/attempts/:attemptId/result
// @desc    Get quiz result
// @access  Private (Student)
router.get('/attempts/:attemptId/result', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const result = await QuizResult.findOne({ attemptId: req.params.attemptId });

        if (!result) {
            throw new AppError('Result not found', 404);
        }

        if (result.studentId.toString() !== req.user?.id) {
            throw new AppError('Unauthorized', 403);
        }

        // Get quiz for additional context
        const quiz = await Quiz.findById(result.quizId);

        res.status(200).json({
            success: true,
            data: {
                result,
                quiz: {
                    title: quiz?.title,
                    settings: quiz?.settings,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/:id/leaderboard
// @desc    Get leaderboard for a quiz
// @access  Private (Student)
router.get('/:id/leaderboard', protect, async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        // Get top results
        const results = await QuizResult.find({ quizId: quiz._id }).sort({ marksObtained: -1, timeTaken: 1 }).limit(100);

        const leaderboard = results.map((result, index) => ({
            rank: index + 1,
            studentName: result.studentName,
            marksObtained: result.marksObtained,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            timeTaken: result.timeTaken,
            attemptDate: result.createdAt,
        }));

        res.status(200).json({
            success: true,
            count: leaderboard.length,
            data: leaderboard,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
