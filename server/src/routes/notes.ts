import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Note } from '../models/Note';
import { User } from '../models/User';
import { Course } from '../models/Course';
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
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx'];

    // Check MIME type or extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        return cb(null, true);
    }

    cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // Up to 50MB per upload
    }
});

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
    const { courseId, subjectId, chapterId, fileType, category, search } = req.query;
    const filters: any[] = [];

    const resolvedCourseId = forcedCourseId || (courseId as string | undefined);
    if (resolvedCourseId) filters.push({ courseId: resolvedCourseId });
    if (subjectId && subjectId !== 'all') filters.push({ subjectId });
    if (chapterId && chapterId !== 'all') filters.push({ chapterId });
    if (fileType && fileType !== 'all') filters.push({ fileType });
    if (category && category !== 'all') filters.push({ category });
    if (search) {
        const searchStr = String(search);
        filters.push({
            $or: [
                { title: { $regex: searchStr, $options: 'i' } },
                { description: { $regex: searchStr, $options: 'i' } },
                { subjectName: { $regex: searchStr, $options: 'i' } },
                { chapterName: { $regex: searchStr, $options: 'i' } },
            ],
        });
    }

    return filters;
}

async function getAccessibleNoteQuery(req: Request, forcedCourseId?: string) {
    const filters = buildNotesFilters(req, forcedCourseId);
    const studentAccess = await getStudentNoteAccess(req, forcedCourseId);

    if (studentAccess) {
        // Enforce active status for students
        filters.push({ status: 'active' });

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

// @route   GET /api/notes/courses/:courseId/subjects/:subjectId/notes
// @desc    Get notes specifically for a course & subject with enrollment validation & sorting
// @access  Private/Public (Student enrollment validated)
router.get('/courses/:courseId/subjects/:subjectId/notes', async (req: Request, res: Response, next) => {
    try {
        const { courseId, subjectId } = req.params;
        const { search, fileType, chapterId, sort } = req.query;

        console.log(`[STUDENT NOTE FETCH] courseId: ${courseId}, subjectId: ${subjectId}, query:`, req.query);

        // Fetch Course & Subject metadata
        const courseDoc = await Course.findById(courseId).select('title subjects');
        if (!courseDoc) {
            throw new AppError('Course not found', 404);
        }

        const subjectDoc = (courseDoc.subjects || []).find(
            (s: any) => s._id.toString() === subjectId || s.name === subjectId
        );
        const subjectName = subjectDoc ? subjectDoc.name : '';

        // Check Student Enrollment if caller is a student
        const requester = await getRequestUser(req);
        if (requester && requester.role === 'student') {
            const enrollment = await Enrollment.findOne({
                userId: requester.id,
                courseId,
                status: 'paid',
            });

            if (!enrollment) {
                console.log(`[ENROLLMENT VERIFICATION FAILED] Student ${requester.id} not enrolled in course ${courseId}`);
                throw new AppError('You are not enrolled in this course.', 403);
            }
        }

        // Build Mongo Query
        const query: any = {
            courseId,
            subjectId,
            status: 'active',
        };

        if (chapterId && chapterId !== 'all') {
            query.chapterId = chapterId;
        }

        if (fileType && fileType !== 'all') {
            query.fileType = fileType;
        }

        if (search) {
            const searchStr = String(search);
            query.$or = [
                { title: { $regex: searchStr, $options: 'i' } },
                { description: { $regex: searchStr, $options: 'i' } },
                { chapterName: { $regex: searchStr, $options: 'i' } },
                { tags: { $in: [new RegExp(searchStr, 'i')] } },
            ];
        }

        // Sorting logic
        let sortOption: any = { createdAt: -1 }; // default newest
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'alphabetical') {
            sortOption = { title: 1 };
        }

        console.log(`[MONGO NOTE QUERY]`, JSON.stringify(query));

        const notes = await Note.find(query)
            .populate('uploadedBy', 'name')
            .sort(sortOption);

        res.status(200).json({
            success: true,
            course: {
                _id: courseDoc._id,
                title: courseDoc.title,
            },
            subject: {
                _id: subjectId,
                name: subjectName,
            },
            totalNotes: notes.length,
            notes,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/notes
// @desc    Get all notes (optionally by courseId/subjectId)
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
// @desc    Get all notes for a specific course
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

// @route   GET /api/notes/:id/download
// @desc    Download note file
// @access  Public (enrolled students & admins)
router.get('/:id/download', async (req: Request, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            throw new AppError('Note not found', 404);
        }

        const canAccess = await canAccessSingleNote(req, note);
        if (!canAccess) {
            throw new AppError('You are not enrolled in this subject', 403);
        }

        if (!note.fileUrl) {
            throw new AppError('Note does not have an attached file', 400);
        }

        const filePath = path.join(__dirname, '../../public', note.fileUrl);
        if (!fs.existsSync(filePath)) {
            throw new AppError('File not found on server', 404);
        }

        res.download(filePath, note.title + path.extname(note.fileUrl));
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
        console.log('[ADMIN NOTE UPLOAD] Request Body:', req.body);
        console.log('[ADMIN NOTE UPLOAD] Request File:', req.file);

        const { title, description, courseId, subjectId, subjectName, chapterId, chapterName, fileType } = req.body;

        // Step 2 Validation: Reject upload if courseId or subjectId is missing
        if (!courseId || !courseId.trim()) {
            throw new AppError('Course selection is required for uploading notes.', 400);
        }
        if (!subjectId || !subjectId.trim()) {
            throw new AppError('Subject selection is required for uploading notes.', 400);
        }
        if (!title || !title.trim()) {
            throw new AppError('Note title is required.', 400);
        }
        if (!description || !description.trim()) {
            throw new AppError('Note description is required.', 400);
        }

        let resolvedFileType = fileType || 'file';
        if (req.file) {
            const ext = path.extname(req.file.originalname).toLowerCase();
            if (ext === '.pdf') resolvedFileType = 'pdf';
            else if (ext === '.txt') resolvedFileType = 'txt';
            else if (ext === '.doc' || ext === '.docx') resolvedFileType = 'doc';
        }

        const noteData: any = {
            title: title.trim(),
            description: description.trim(),
            courseId,
            subjectId,
            subjectName: subjectName || '',
            chapterId: chapterId || '',
            chapterName: chapterName || '',
            category: req.body.category || '',
            tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [],
            uploadedBy: req.user._id,
            status: 'active',
        };

        // Handle content mode
        if (resolvedFileType === 'html') {
            if (!req.body.markdownContent) {
                throw new AppError('Markdown content is required for HTML notes', 400);
            }
            noteData.fileType = 'html';
            noteData.markdownContent = req.body.markdownContent;
        } else {
            if (!req.file) {
                throw new AppError('A PDF, TXT, or DOC file upload is required for file notes.', 400);
            }
            noteData.fileUrl = `/notes/${req.file.filename}`;
            noteData.fileType = resolvedFileType;
        }

        const note = await Note.create(noteData);
        console.log('[NOTE CREATED SUCCESSFULLY]', note._id);

        res.status(201).json({
            success: true,
            data: note,
        });
    } catch (error) {
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
        console.log('[ADMIN NOTE UPDATE] Body:', req.body);

        const note = await Note.findById(req.params.id);
        if (!note) {
            throw new AppError('Note not found', 404);
        }

        const { courseId, subjectId } = req.body;
        if (courseId && !courseId.trim()) throw new AppError('CourseId cannot be empty', 400);
        if (subjectId && !subjectId.trim()) throw new AppError('SubjectId cannot be empty', 400);

        let resolvedFileType = req.body.fileType || note.fileType;
        if (req.file) {
            const ext = path.extname(req.file.originalname).toLowerCase();
            if (ext === '.pdf') resolvedFileType = 'pdf';
            else if (ext === '.txt') resolvedFileType = 'txt';
            else if (ext === '.doc' || ext === '.docx') resolvedFileType = 'doc';
        }

        const updateData: any = {
            title: req.body.title || note.title,
            description: req.body.description || note.description,
            courseId: req.body.courseId || note.courseId,
            subjectId: req.body.subjectId || note.subjectId,
            subjectName: req.body.subjectName !== undefined ? req.body.subjectName : note.subjectName,
            chapterId: req.body.chapterId !== undefined ? req.body.chapterId : note.chapterId,
            chapterName: req.body.chapterName !== undefined ? req.body.chapterName : note.chapterName,
            category: req.body.category !== undefined ? req.body.category : note.category,
            status: req.body.status || note.status || 'active',
            tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : note.tags,
            fileType: resolvedFileType,
        };

        if (resolvedFileType === 'html') {
            if (req.body.markdownContent) {
                updateData.markdownContent = req.body.markdownContent;
                if (note.fileUrl) {
                    const oldFilePath = path.join(__dirname, '../../public', note.fileUrl);
                    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
                    updateData.fileUrl = undefined;
                }
            }
        } else if (req.file) {
            if (note.fileUrl) {
                const oldFilePath = path.join(__dirname, '../../public', note.fileUrl);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
            updateData.fileUrl = `/notes/${req.file.filename}`;
            updateData.markdownContent = undefined;
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
