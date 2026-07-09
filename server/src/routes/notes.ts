import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Note } from '../models/Note';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { protect, authorize } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { validate } from '../middleware/validate';
import { createNoteSchema, updateNoteSchema } from '../validators/schemas';
import { fileUploadLimiter } from '../middleware/rateLimiter';

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
    const allowedMimes = [
        'application/pdf',
        'text/plain'
    ];
    const allowedExtensions = ['.pdf', '.txt'];

    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return cb(new Error(`Invalid file extension. Only ${allowedExtensions.join(', ')} files are allowed.`));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max (reduced from 10MB)
    }
});

// Helper: resolve enrolled subject IDs for a student in a given course (or across all courses)
// Returns null if the caller is an admin/teacher (no filtering needed)
async function getEnrolledSubjectIds(
    req: Request,
    courseId?: string
): Promise<Set<string> | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null; // no token — unauthenticated
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('role');
        if (!user) return null;
        // Admin / teacher: no restriction
        if (user.role === 'admin' || user.role === 'teacher') return null;
        // Student: collect enrolled subjectIds
        const query: any = { userId: decoded.id, status: 'paid' };
        if (courseId) query.courseId = courseId;
        const enrollments = await Enrollment.find(query);
        const ids = new Set<string>();
        enrollments.forEach((e: any) => {
            if (e.subjectId) ids.add(e.subjectId.toString());
        });
        return ids;
    } catch {
        return null; // invalid token — treat as unauthenticated (public)
    }
}

interface StudentNoteAccess {
    courseIds: Set<string>;
    subjectIds: Set<string>;
}

async function getRequestUser(req: Request): Promise<{ id: string; role: string } | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('role');
        if (!user) return null;
        return { id: decoded.id, role: user.role };
    } catch {
        return null;
    }
}

// Returns null for admin/teacher/guests, meaning no student-specific filtering is needed.
async function getStudentNoteAccess(
    req: Request,
    courseId?: string
): Promise<StudentNoteAccess | null> {
    const requester = await getRequestUser(req);
    if (!requester || requester.role === 'admin' || requester.role === 'teacher') return null;

    const query: any = { userId: requester.id, status: 'paid' };
    if (courseId) query.courseId = courseId;

    const enrollments = await Enrollment.find(query).select('courseId subjectId');
    return enrollments.reduce<StudentNoteAccess>(
        (access, enrollment: any) => {
            if (enrollment.courseId) access.courseIds.add(enrollment.courseId.toString());
            if (enrollment.subjectId) access.subjectIds.add(enrollment.subjectId.toString());
            return access;
        },
        { courseIds: new Set<string>(), subjectIds: new Set<string>() }
    );
}

const generalNoteFilter = (courseIds: string[]) => ({
    $and: [
        { courseId: { $in: courseIds } },
        {
            $or: [
                { subjectId: { $exists: false } },
                { subjectId: null },
            ],
        },
    ],
});

function buildNotesFilters(req: Request, forcedCourseId?: string) {
    const { courseId, subjectId, fileType, category, search } = req.query;
    const filters: any[] = [];

    const resolvedCourseId = forcedCourseId || (courseId as string | undefined);
    if (resolvedCourseId) filters.push({ courseId: resolvedCourseId });
    if (subjectId && subjectId !== 'all') filters.push({ subjectId });
    if (fileType && fileType !== 'all') filters.push({ fileType });
    if (category && category !== 'all') filters.push({ category });
    if (search) {
        const searchRegex = new RegExp(String(search), 'i');
        filters.push({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex },
                { subjectName: searchRegex },
            ],
        });
    }

    return filters;
}

async function getAccessibleNoteQuery(req: Request, forcedCourseId?: string) {
    const filters = buildNotesFilters(req, forcedCourseId);
    const studentAccess = await getStudentNoteAccess(req, forcedCourseId);

    if (studentAccess) {
        const accessFilters: any[] = [];
        const subjectIds = Array.from(studentAccess.subjectIds);
        const courseIds = Array.from(studentAccess.courseIds);

        if (subjectIds.length > 0) accessFilters.push({ subjectId: { $in: subjectIds } });
        if (courseIds.length > 0) accessFilters.push(generalNoteFilter(courseIds));

        filters.push(accessFilters.length > 0 ? { $or: accessFilters } : { _id: { $exists: false } });
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];
    return { $and: filters };
}

async function canAccessSingleNote(req: Request, note: any): Promise<boolean> {
    const studentAccess = await getStudentNoteAccess(req, note.courseId?.toString());
    if (!studentAccess) return true;

    const noteCourseId = note.courseId?.toString();
    const noteSubjectId = note.subjectId?.toString();

    if (noteSubjectId) return studentAccess.subjectIds.has(noteSubjectId);
    return noteCourseId ? studentAccess.courseIds.has(noteCourseId) : false;
}

// @route   GET /api/notes
// @desc    Get all notes (optionally by courseId). For students, only returns notes
//          belonging to subjects they are enrolled in (or general notes with no subject).
// @access  Public (content filtered for students)
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const query = await getAccessibleNoteQuery(req);
        const notes = await Note.find(query).populate('uploadedBy', 'name').sort({ createdAt: -1 });

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
// @desc    Get all notes for a specific course. For students, only returns notes
//          belonging to subjects they are enrolled in (or general notes with no subject).
// @access  Public (content filtered for students)
router.get('/course/:courseId', async (req: Request, res: Response, next) => {
    try {
        const { courseId } = req.params;
        const query = await getAccessibleNoteQuery(req, courseId);
        const notes = await Note.find(query).populate('uploadedBy', 'name').sort({ createdAt: -1 });

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

        const canAccess = await canAccessSingleNote(req, note);
        if (!canAccess) {
            throw new AppError('You are not enrolled in this subject', 403);
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
// @desc    Create a new note (with file upload OR markdown content)
// @access  Private (Admin/Teacher)
router.post('/', protect, authorize('admin', 'teacher'), fileUploadLimiter, upload.single('file'), async (req: any, res: Response, next) => {
    try {
        const { fileType } = req.body;

        const noteData: any = {
            title: req.body.title,
            description: req.body.description,
            courseId: req.body.courseId,
            subjectId: req.body.subjectId || null,
            subjectName: req.body.subjectName || '',
            category: req.body.category || '',
            tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [],
            uploadedBy: req.user._id,
        };

        // Handle different content types
        if (fileType === 'html') {
            // Markdown/HTML content mode
            if (!req.body.markdownContent) {
                throw new AppError('Markdown content is required for html type notes', 400);
            }
            noteData.fileType = 'html';
            noteData.markdownContent = req.body.markdownContent;
        } else {
            // File upload mode
            if (!req.file) {
                throw new AppError('File upload is required for file type notes', 400);
            }
            noteData.fileUrl = `/notes/${req.file.filename}`;
            noteData.fileType = 'file';
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
// @desc    Update a note (file upload OR markdown content)
// @access  Private (Admin/Teacher)
router.put('/:id', protect, authorize('admin', 'teacher'), fileUploadLimiter, upload.single('file'), async (req: any, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            throw new AppError('Note not found', 404);
        }

        const { fileType } = req.body;

        const updateData: any = {
            title: req.body.title,
            description: req.body.description,
            courseId: req.body.courseId,
            subjectId: req.body.subjectId || null,
            subjectName: req.body.subjectName || '',
            category: req.body.category || '',
            tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [],
        };

        // Handle different content types
        if (fileType === 'html') {
            // Markdown/HTML content mode
            if (req.body.markdownContent) {
                updateData.markdownContent = req.body.markdownContent;
                updateData.fileType = 'html';
                // Clear fileUrl if switching from file to html
                if (note.fileUrl) {
                    const oldFilePath = path.join(__dirname, '../../public', note.fileUrl);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                    updateData.fileUrl = undefined;
                }
            }
        } else {
            // File upload mode
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
                // Clear markdownContent if switching from html to file
                updateData.markdownContent = undefined;
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
