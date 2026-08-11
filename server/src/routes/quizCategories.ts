import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { QuizCategory } from '../models/QuizCategory';
import { Quiz } from '../models/Quiz';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// ── GET /api/quiz-categories ──────────────────────────────────────────────────
// @desc    Get active categories for a course and optional subject
// @access  Public / Authenticated
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const { courseId, subjectId } = req.query;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'courseId parameter is required',
            });
        }

        const filter: any = {
            courseId: new mongoose.Types.ObjectId(courseId as string),
            isActive: true,
        };

        if (subjectId) {
            // Include subject-specific categories AND course-level categories (where subjectId is null/undefined)
            filter.$or = [
                { subjectId: new mongoose.Types.ObjectId(subjectId as string) },
                { subjectId: null },
                { subjectId: { $exists: false } },
            ];
        }

        const categories = await QuizCategory.find(filter).sort({ order: 1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/quiz-categories/admin ───────────────────────────────────────────
// @desc    Get all categories for admin (including inactive) for course/subject
// @access  Private (Admin)
router.get('/admin', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, subjectId } = req.query;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'courseId parameter is required',
            });
        }

        const filter: any = {
            courseId: new mongoose.Types.ObjectId(courseId as string),
        };

        if (subjectId && subjectId !== 'all') {
            filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);
        } else if (subjectId === 'course-level') {
            filter.$or = [{ subjectId: null }, { subjectId: { $exists: false } }];
        }

        const categories = await QuizCategory.find(filter).sort({ order: 1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/quiz-categories/by-course/:courseId ─────────────────────────────
// @desc    Get all active categories for a course grouped or listing all
// @access  Public / Authenticated
router.get('/by-course/:courseId', async (req: Request, res: Response, next) => {
    try {
        const { courseId } = req.params;

        const categories = await QuizCategory.find({
            courseId: new mongoose.Types.ObjectId(courseId),
            isActive: true,
        }).sort({ order: 1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/quiz-categories ────────────────────────────────────────────────
// @desc    Create a new quiz category
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { courseId, subjectId, name, description, icon, color, order } = req.body;

        if (!courseId || !name) {
            throw new AppError('courseId and name are required', 400);
        }

        // Determine highest order if not supplied
        let categoryOrder = order;
        if (typeof categoryOrder !== 'number') {
            const count = await QuizCategory.countDocuments({
                courseId: new mongoose.Types.ObjectId(courseId),
                subjectId: subjectId ? new mongoose.Types.ObjectId(subjectId) : null,
            });
            categoryOrder = count;
        }

        const category = await QuizCategory.create({
            courseId: new mongoose.Types.ObjectId(courseId),
            subjectId: subjectId ? new mongoose.Types.ObjectId(subjectId) : null,
            name: name.trim(),
            description: description || '',
            icon: icon || '📝',
            color: color || '#6366f1',
            order: categoryOrder,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            data: category,
            message: 'Quiz category created successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/quiz-categories/reorder ─────────────────────────────────────────
// @desc    Batch reorder quiz categories
// @access  Private (Admin)
router.put('/reorder', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { items } = req.body; // Array of { id: string, order: number }

        if (!Array.isArray(items)) {
            throw new AppError('items must be an array of { id, order }', 400);
        }

        const bulkOps = items.map((item) => ({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(item.id) },
                update: { $set: { order: item.order } },
            },
        }));

        if (bulkOps.length > 0) {
            await QuizCategory.bulkWrite(bulkOps);
        }

        res.status(200).json({
            success: true,
            message: 'Categories reordered successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/quiz-categories/:id ─────────────────────────────────────────────
// @desc    Update a quiz category
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, description, icon, color, isActive, order, subjectId } = req.body;

        const category = await QuizCategory.findById(req.params.id);
        if (!category) {
            throw new AppError('Quiz category not found', 404);
        }

        const oldName = category.name;

        if (name !== undefined) category.name = name.trim();
        if (description !== undefined) category.description = description;
        if (icon !== undefined) category.icon = icon;
        if (color !== undefined) category.color = color;
        if (isActive !== undefined) category.isActive = isActive;
        if (order !== undefined) category.order = order;
        if (subjectId !== undefined) {
            category.subjectId = subjectId ? new mongoose.Types.ObjectId(subjectId) : undefined;
        }

        await category.save();

        // If category name updated, update all existing Quizzes that reference this category
        if (name !== undefined && name.trim() !== oldName) {
            await Quiz.updateMany(
                { categoryId: category._id },
                { $set: { categoryName: category.name } }
            );
        }

        res.status(200).json({
            success: true,
            data: category,
            message: 'Quiz category updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/quiz-categories/:id ──────────────────────────────────────────
// @desc    Delete a quiz category (clears category reference from affected quizzes)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const category = await QuizCategory.findById(req.params.id);
        if (!category) {
            throw new AppError('Quiz category not found', 404);
        }

        // Remove reference from Quizzes
        await Quiz.updateMany(
            { categoryId: category._id },
            { $unset: { categoryId: 1, categoryName: 1 } }
        );

        await QuizCategory.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Quiz category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
