import { Router, Request, Response } from 'express';
import { UserNote } from '../models/UserNote';
import { Note } from '../models/Note';
import { Enrollment } from '../models/Enrollment';
import { protect } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// @route   POST /api/user-notes/save
// @desc    Save a note to student's library
// @access  Private (Student)
router.post('/save', protect, async (req: any, res: Response, next) => {
    try {
        const { noteId, category } = req.body;
        const userId = req.user._id;

        if (!noteId) {
            throw new AppError('Note ID is required', 400);
        }

        // Check if note exists
        const note = await Note.findById(noteId);
        if (!note) {
            throw new AppError('Note not found', 404);
        }

        // Verify user is enrolled in the course
        const enrollment = await Enrollment.findOne({
            userId,
            courseId: note.courseId,
        });

        if (!enrollment) {
            throw new AppError('You must be enrolled in this course to save notes', 403);
        }

        // Check if already saved
        const existingUserNote = await UserNote.findOne({ userId, noteId });
        if (existingUserNote) {
            return res.status(200).json({
                success: true,
                message: 'Note already in your library',
                data: existingUserNote,
            });
        }

        // Save note to user's library
        const userNote = await UserNote.create({
            userId,
            noteId,
            category: category || 'Uncategorized',
        });

        const populatedNote = await UserNote.findById(userNote._id)
            .populate('noteId')
            .populate({
                path: 'noteId',
                populate: {
                    path: 'courseId',
                    select: 'title',
                },
            });

        res.status(201).json({
            success: true,
            message: 'Note saved to your library',
            data: populatedNote,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/user-notes
// @desc    Get all notes saved by student
// @access  Private (Student)
router.get('/', protect, async (req: any, res: Response, next) => {
    try {
        const userId = req.user._id;
        const { category, courseId } = req.query;

        const query: any = { userId };
        if (category) {
            query.category = category;
        }

        let userNotes = await UserNote.find(query)
            .populate({
                path: 'noteId',
                populate: {
                    path: 'courseId',
                    select: 'title thumbnail',
                },
            })
            .sort({ savedAt: -1 });

        // Filter by course if specified
        if (courseId) {
            userNotes = userNotes.filter(
                (un: any) => un.noteId?.courseId?._id?.toString() === courseId
            );
        }

        res.status(200).json({
            success: true,
            count: userNotes.length,
            data: userNotes,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/user-notes/check/:noteId
// @desc    Check if a note is saved by student
// @access  Private (Student)
router.get('/check/:noteId', protect, async (req: any, res: Response, next) => {
    try {
        const userId = req.user._id;
        const { noteId } = req.params;

        const userNote = await UserNote.findOne({ userId, noteId });

        res.status(200).json({
            success: true,
            isSaved: !!userNote,
            data: userNote,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/user-notes/:id
// @desc    Remove note from student's library
// @access  Private (Student)
router.delete('/:id', protect, async (req: any, res: Response, next) => {
    try {
        const userId = req.user._id;
        const userNote = await UserNote.findById(req.params.id);

        if (!userNote) {
            throw new AppError('Note not found in your library', 404);
        }

        // Verify ownership
        if (userNote.userId.toString() !== userId.toString()) {
            throw new AppError('Not authorized to remove this note', 403);
        }

        await userNote.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Note removed from your library',
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/user-notes/:id/category
// @desc    Update category of saved note
// @access  Private (Student)
router.put('/:id/category', protect, async (req: any, res: Response, next) => {
    try {
        const userId = req.user._id;
        const { category } = req.body;

        const userNote = await UserNote.findById(req.params.id);

        if (!userNote) {
            throw new AppError('Note not found in your library', 404);
        }

        // Verify ownership
        if (userNote.userId.toString() !== userId.toString()) {
            throw new AppError('Not authorized to update this note', 403);
        }

        userNote.category = category || 'Uncategorized';
        await userNote.save();

        const populatedNote = await UserNote.findById(userNote._id)
            .populate('noteId')
            .populate({
                path: 'noteId',
                populate: {
                    path: 'courseId',
                    select: 'title',
                },
            });

        res.status(200).json({
            success: true,
            message: 'Category updated',
            data: populatedNote,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/user-notes/:id/view
// @desc    Update last viewed timestamp and increment view count
// @access  Private (Student)
router.put('/:id/view', protect, async (req: any, res: Response, next) => {
    try {
        const userId = req.user._id;
        const userNote = await UserNote.findById(req.params.id);

        if (!userNote) {
            throw new AppError('Note not found in your library', 404);
        }

        // Verify ownership
        if (userNote.userId.toString() !== userId.toString()) {
            throw new AppError('Not authorized to view this note', 403);
        }

        userNote.lastViewed = new Date();
        userNote.viewCount += 1;
        await userNote.save();

        res.status(200).json({
            success: true,
            data: userNote,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
