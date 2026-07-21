import { Router, Request, Response } from 'express';
import { Quiz } from '../models/Quiz';
import { QuizAttempt } from '../models/QuizAttempt';
import { QuizResult } from '../models/QuizResult';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import mongoose from 'mongoose';

const router = Router();

// ==================== ADMIN ROUTES ====================

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, ...quizData } = req.body;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Create quiz
        const quiz = await Quiz.create({
            ...quizData,
            courseId,
            courseName: course.title,
            createdBy: req.user?.id,
            isPublished: false,
        });

        res.status(201).json({
            success: true,
            data: quiz,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes
// @desc    Get all quizzes (admin)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const { courseId, isPublished } = req.query;

        const filter: any = {};
        if (courseId) filter.courseId = courseId;
        if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

        const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/quizzes/:id
// @desc    Get quiz by ID (admin view with all details)
// @access  Private (Admin)
router.get('/:id/admin', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('courseId');

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        res.status(200).json({
            success: true,
            data: quiz,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/quizzes/:id
// @desc    Update a quiz
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        res.status(200).json({
            success: true,
            data: quiz,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);

        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        // Delete all attempts and results
        await QuizAttempt.deleteMany({ quizId: quiz._id });
        await QuizResult.deleteMany({ quizId: quiz._id });

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/quizzes/:id/publish
// @desc    Publish/unpublish a quiz
// @access  Private (Admin)
router.post('/:id/publish', protect, authorize('admin'), async (req: Request, res: Response, next) => {
    try {
        const { isPublished } = req.body;

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        // Validate quiz has questions
        if (isPublished && quiz.questions.length === 0) {
            throw new AppError('Cannot publish quiz without questions', 400);
        }

        quiz.isPublished = isPublished;
        await quiz.save();

        res.status(200).json({
            success: true,
            data: quiz,
            message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
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

        // Calculate statistics
        const stats = {
            totalAttempts: results.length,
            averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length : 0,
            averagePercentage: results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0,
            highestScore: results.length > 0 ? Math.max(...results.map((r) => r.marksObtained)) : 0,
            lowestScore: results.length > 0 ? Math.min(...results.map((r) => r.marksObtained)) : 0,
            passRate: results.length > 0 ? (results.filter((r) => r.isPassed).length / results.length) * 100 : 0,
        };

        res.status(200).json({
            success: true,
            count: results.length,
            stats,
            data: results,
        });
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
        if (!quiz) {
            throw new AppError('Quiz not found', 404);
        }

        const results = await QuizResult.find({ quizId: req.params.id });

        // Question-wise analysis
        const questionAnalysis = quiz.questions.map((question: any) => {
            const questionResults = results.flatMap((r: any) => r.questionResults.filter((qr: any) => qr.questionId.toString() === question._id?.toString()));

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

        // Score distribution
        const scoreRanges = {
            '0-25': 0,
            '26-50': 0,
            '51-75': 0,
            '76-100': 0,
        };

        results.forEach((result) => {
            if (result.percentage <= 25) scoreRanges['0-25']++;
            else if (result.percentage <= 50) scoreRanges['26-50']++;
            else if (result.percentage <= 75) scoreRanges['51-75']++;
            else scoreRanges['76-100']++;
        });

        res.status(200).json({
            success: true,
            data: {
                questionAnalysis,
                scoreDistribution: scoreRanges,
                totalAttempts: results.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ==================== STUDENT ROUTES ====================

// @route   GET /api/quizzes/available
// @desc    Get available quizzes for enrolled courses
// @access  Private (Student)
// ─── Helper: Verify quiz access for user ─────────────────────────────────────
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

        let quizzes: any[] = [];

        if (user.role === 'admin' || user.role === 'teacher') {
            quizzes = await Quiz.find({ isPublished: true }).select('-questions');
        } else {
            // Get all paid enrollments
            const enrollments = await Enrollment.find({ userId: user._id, status: 'paid' });
            
            // Get free courses
            const freeCourses = await Course.find({
                $or: [{ price: 0 }, { paymentEnabled: false }]
            }).select('_id');

            const enrolledCourseIds = new Set<string>();
            enrollments.forEach((e) => enrolledCourseIds.add(e.courseId.toString()));
            (user.enrolledCourses || []).forEach((cId: any) => enrolledCourseIds.add(cId.toString()));
            freeCourses.forEach((c) => enrolledCourseIds.add(c._id.toString()));

            if (enrolledCourseIds.size === 0) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    data: [],
                });
            }

            const queryCourseObjectIds = Array.from(enrolledCourseIds).map(
                (id) => new mongoose.Types.ObjectId(id)
            );

            quizzes = await Quiz.find({
                courseId: { $in: queryCourseObjectIds },
                isPublished: true,
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
            const quizResults = results.filter((r) => r.quizId.toString() === quiz._id.toString());
            const inProgressAttempt = quizAttempts.find((a) => a.status === 'in-progress');

            return {
                ...quiz.toObject(),
                attemptCount: quizAttempts.length,
                status: inProgressAttempt ? 'in-progress' : quizResults.length > 0 ? 'completed' : 'not-attempted',
                lastScore: quizResults.length > 0 ? quizResults[quizResults.length - 1].marksObtained : null,
                lastPercentage: quizResults.length > 0 ? quizResults[quizResults.length - 1].percentage : null,
                inProgressAttemptId: inProgressAttempt?._id,
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
            marks: typeof q.marks === 'number' ? q.marks : 1,
            negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : 0,
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
        const attempt = await QuizAttempt.findById(req.params.attemptId);

        if (!attempt) {
            throw new AppError('Attempt not found', 404);
        }

        if (attempt.studentId.toString() !== req.user?.id) {
            throw new AppError('Unauthorized', 403);
        }

        if (attempt.status !== 'in-progress') {
            throw new AppError('Attempt already submitted', 400);
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

        const questionResults = quiz.questions.map((question: any) => {
            const studentAnswer = attempt.answers.find((a: any) => a.questionId.toString() === question._id?.toString());

            const marks = question.marks || quiz.settings.marksPerQuestion;
            const negativeMarks = question.negativeMarks !== undefined ? question.negativeMarks : quiz.settings.negativeMarking;

            totalMarks += marks;

            if (!studentAnswer) {
                unansweredQuestions++;
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

            // ── Match the Following scoring ──────────────────────────────────
            if (question.questionType === 'match') {
                const pairs: { left: string; right: string }[] = question.matchPairs || [];
                let correctPairs = 0;

                try {
                    // Student answer format: JSON object { "0": "1", "1": "0", ... }
                    // Keys = left-item index, values = right-item index selected by student
                    const mapping: Record<string, string> = JSON.parse(studentAnswer.selectedAnswer || '{}');

                    pairs.forEach((pair, leftIdx) => {
                        const selectedRightIdx = parseInt(mapping[String(leftIdx)], 10);
                        const correctRightItem = pair.right;
                        const selectedRightItem = pairs[selectedRightIdx]?.right;
                        if (selectedRightItem === correctRightItem) correctPairs++;
                    });
                } catch {
                    // malformed answer — 0 correct pairs
                }

                const pairMarks = pairs.length > 0 ? marks / pairs.length : 0;
                const awarded = Math.round(correctPairs * pairMarks * 10) / 10;
                const isFullyCorrect = correctPairs === pairs.length;

                if (isFullyCorrect) correctAnswers++;
                else incorrectAnswers++;

                marksObtained += awarded;

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

            // ── Standard MCQ scoring ─────────────────────────────────────────
            const isCorrect = studentAnswer.selectedAnswer === question.correctAnswer;

            if (isCorrect) {
                correctAnswers++;
                marksObtained += marks;
            } else {
                incorrectAnswers++;
                marksObtained -= negativeMarks;
            }

            return {
                questionId: question._id!,
                questionText: question.questionText,
                selectedAnswer: studentAnswer.selectedAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                marksAwarded: isCorrect ? marks : -negativeMarks,
                explanation: question.explanation,
            };
        });

        // Ensure marksObtained is not negative
        marksObtained = Math.max(0, marksObtained);

        const percentage = (marksObtained / totalMarks) * 100;
        const isPassed = percentage >= (quiz.settings.passingPercentage || 40);

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
            totalQuestions: quiz.totalQuestions,
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

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            data: {
                resultId: result._id,
                marksObtained,
                totalMarks,
                percentage,
                isPassed,
                rank: result.rank,
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
