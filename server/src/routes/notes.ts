import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Note } from '../models/Note';
import { protect, authorize } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/notes');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    }
});

// @route   GET /api/notes
// @desc    Get all notes (optionally by courseId)
// @access  Public
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const { courseId } = req.query;
        const filter = courseId ? { courseId } : {};

        const notes = await Note.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/notes/course/:courseId
// @desc    Get all notes for a specific course
// @access  Public
router.get('/course/:courseId', async (req: Request, res: Response, next) => {
    try {
        const notes = await Note.find({ courseId: req.params.courseId })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Public
router.get('/:id', async (req: Request, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id).populate('uploadedBy', 'name');

        if (!note) {
            throw new AppError('Note not found', 404);
        }

        res.status(200).json({
            success: true,
            data: note,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/notes
// @desc    Create a new note (with optional file upload)
// @access  Private (Admin/Teacher)
router.post('/', protect, authorize('admin', 'teacher'), upload.single('file'), async (req: any, res: Response, next) => {
    try {
        const noteData: any = {
            title: req.body.title,
            description: req.body.description,
            courseId: req.body.courseId,
            fileType: req.body.fileType || 'markdown',
            category: req.body.category || '',
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            uploadedBy: req.user._id,
        };

        // If file is uploaded
        if (req.file) {
            noteData.fileUrl = `/notes/${req.file.filename}`;
            noteData.fileType = 'file';
        } else if (req.body.markdownContent) {
            // If markdown content is provided
            noteData.markdownContent = req.body.markdownContent;
            noteData.fileType = 'markdown';
        }

        const note = await Note.create(noteData);

        res.status(201).json({
            success: true,
            data: note,
        });
    } catch (error) {
        // Clean up uploaded file if note creation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private (Admin/Teacher)
router.put('/:id', protect, authorize('admin', 'teacher'), upload.single('file'), async (req: any, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            throw new AppError('Note not found', 404);
        }

        const updateData: any = {
            title: req.body.title,
            description: req.body.description,
            courseId: req.body.courseId,
            category: req.body.category || '',
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        };

        // If new file is uploaded
        if (req.file) {
            // Delete old file if exists
            if (note.fileUrl) {
                const oldFilePath = path.join(__dirname, '../../public', note.fileUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            updateData.fileUrl = `/notes/${req.file.filename}`;
            updateData.fileType = 'file';
            updateData.markdownContent = ''; // Clear markdown if switching to file
        } else if (req.body.markdownContent !== undefined) {
            // If markdown content is provided
            updateData.markdownContent = req.body.markdownContent;
            updateData.fileType = 'markdown';
            // Delete old file if switching from file to markdown
            if (note.fileUrl) {
                const oldFilePath = path.join(__dirname, '../../public', note.fileUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
                updateData.fileUrl = '';
            }
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedNote,
        });
    } catch (error) {
        // Clean up uploaded file if update fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private (Admin/Teacher)
router.delete('/:id', protect, authorize('admin', 'teacher'), async (req: Request, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            throw new AppError('Note not found', 404);
        }

        // Delete associated file if exists
        if (note.fileUrl) {
            const filePath = path.join(__dirname, '../../public', note.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await note.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Note deleted',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
