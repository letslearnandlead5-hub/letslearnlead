import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Note } from '../models/Note';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { NoteAccessLog } from '../models/NoteAccessLog';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { fileUploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─── NOTE VIEW TOKEN CONFIG ───────────────────────────────────────────────────
const NOTE_VIEW_TOKEN_SECRET = process.env.JWT_SECRET + '_note_view';
const NOTE_VIEW_TOKEN_TTL = 5 * 60; // 5 minutes in seconds

interface NoteViewTokenPayload {
    noteId: string;
    studentId: string;
    action: 'view';
    iat?: number;
    exp?: number;
}

// ─── Multer Config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/notes');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        return cb(null, true);
    }
    cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function getStudentNoteAccess(req: Request, courseId?: string): Promise<StudentNoteAccess | null> {
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
        { $or: [{ subjectId: { $exists: false } }, { subjectId: null }] },
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

async function canAccessSingleNote(req: Request, note: any): Promise<{ allowed: boolean; studentId?: string }> {
    const requester = await getRequestUser(req);
    if (!requester) return { allowed: false };
    if (requester.role === 'admin' || requester.role === 'teacher') return { allowed: true };

    const studentAccess = await getStudentNoteAccess(req, note.courseId?.toString());
    if (!studentAccess) return { allowed: true };

    const noteCourseId = note.courseId?.toString();
    const noteSubjectId = note.subjectId?.toString();

    const allowed = noteSubjectId
        ? studentAccess.subjectIds.has(noteSubjectId)
        : (noteCourseId ? studentAccess.courseIds.has(noteCourseId) : false);

    return { allowed, studentId: requester.id };
}

/** Remove fileUrl from note before sending to students */
function sanitizeNoteForStudent(note: any, isPrivileged: boolean): any {
    const obj = note.toObject ? note.toObject() : { ...note };
    if (!isPrivileged) {
        delete obj.fileUrl;          // Never expose storage path
        delete obj.markdownContent;  // Served via stream only
    }
    return obj;
}

async function logNoteAccess(params: {
    studentId: string;
    courseId: string;
    subjectId?: string;
    noteId: string;
    action: 'view' | 'print' | 'token_issued';
    ip?: string;
    userAgent?: string;
}) {
    try {
        await NoteAccessLog.create(params);
        console.log(`[NOTE ACCESS] action=${params.action} studentId=${params.studentId} noteId=${params.noteId} courseId=${params.courseId}`);
    } catch (err) {
        console.error('[NOTE ACCESS LOG ERROR]', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SECURE VIEW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notes/:noteId/view
 * @desc    Issue a short-lived signed view token for an enrolled student
 *          Token is valid for 5 minutes. Never exposes fileUrl.
 * @access  Private (Student / Admin / Teacher)
 */
router.get('/:noteId/view', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { noteId } = req.params;
        const userId = req.user?.id;

        console.log(`[NOTE VIEW TOKEN] noteId=${noteId} userId=${userId}`);

        const note = await Note.findById(noteId);
        if (!note) throw new AppError('Note not found', 404);
        if (note.status !== 'active') throw new AppError('Note is not available', 403);

        const { allowed, studentId } = await canAccessSingleNote(req, note);
        if (!allowed) {
            throw new AppError('You don\'t have permission to view this note.', 403);
        }

        const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'teacher';

        // Generate short-lived token
        const payload: NoteViewTokenPayload = {
            noteId: note._id!.toString(),
            studentId: userId,
            action: 'view',
        };

        const viewToken = jwt.sign(payload, NOTE_VIEW_TOKEN_SECRET, {
            expiresIn: NOTE_VIEW_TOKEN_TTL,
        });

        // Log the token issuance
        if (!isPrivileged && studentId) {
            await logNoteAccess({
                studentId,
                courseId: note.courseId.toString(),
                subjectId: note.subjectId?.toString(),
                noteId: note._id!.toString(),
                action: 'token_issued',
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
        }

        res.status(200).json({
            success: true,
            viewToken,
            expiresIn: NOTE_VIEW_TOKEN_TTL,
            noteId: note._id,
            title: note.title,
            fileType: note.fileType,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/notes/:noteId/view/stream
 * @desc    Token-gated file stream — validates short-lived view token and streams
 *          the note file inline. No permanent URL ever exposed to client.
 *          Sets: Content-Disposition: inline, Cache-Control: no-store, no-cache
 * @access  Via short-lived token (no Authorization header required)
 */
router.get('/:noteId/view/stream', async (req: Request, res: Response, next) => {
    try {
        const { noteId } = req.params;
        const { token } = req.query as { token?: string };

        if (!token) throw new AppError('View token is required', 401);

        // Validate the signed token
        let decoded: NoteViewTokenPayload;
        try {
            decoded = jwt.verify(token, NOTE_VIEW_TOKEN_SECRET) as NoteViewTokenPayload;
        } catch (err: any) {
            const isExpired = err.name === 'TokenExpiredError';
            throw new AppError(
                isExpired ? 'View link has expired. Please request a new one.' : 'Invalid view token.',
                401
            );
        }

        if (decoded.noteId !== noteId) {
            throw new AppError('Token does not match this note.', 403);
        }

        const note = await Note.findById(noteId);
        if (!note || note.status !== 'active') throw new AppError('Note not found', 404);

        // ── HTML/Markdown notes: serve inline HTML ──────────────────────────
        if (note.fileType === 'html' && note.markdownContent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Disposition', 'inline');

            // Log view
            await logNoteAccess({
                studentId: decoded.studentId,
                courseId: note.courseId.toString(),
                subjectId: note.subjectId?.toString(),
                noteId: note._id!.toString(),
                action: 'view',
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
         max-width: 800px; margin: 0 auto; padding: 20px; color: #1F2937; }
  h1,h2,h3 { color: #4F46E5; }
  pre { background: #F3F4F6; padding: 12px; border-radius: 8px; overflow-x: auto; }
  code { font-family: 'Courier New', monospace; font-size: 13px; }
  img { max-width: 100%; }
</style>
<title>${note.title}</title>
</head>
<body>${note.markdownContent}</body>
</html>`;
            return res.send(html);
        }

        // ── File-based notes: stream file ────────────────────────────────────
        if (!note.fileUrl) throw new AppError('This note does not have an attached file.', 404);

        const filePath = path.join(__dirname, '../../public', note.fileUrl);
        if (!fs.existsSync(filePath)) throw new AppError('File not found on server.', 404);

        const ext = path.extname(note.fileUrl).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain; charset=utf-8',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        const stat = fs.statSync(filePath);

        // Security headers: inline viewing only, no save/download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.title)}${ext}"`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Prevent saving from browser "Save As"
        res.setHeader('X-Download-Options', 'noopen');

        // Log the view
        await logNoteAccess({
            studentId: decoded.studentId,
            courseId: note.courseId.toString(),
            subjectId: note.subjectId?.toString(),
            noteId: note._id!.toString(),
            action: 'view',
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/notes/:noteId/print-log
 * @desc    Log that a student printed a note
 * @access  Private
 */
router.post('/:noteId/print-log', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { noteId } = req.params;
        const userId = req.user?.id;

        const note = await Note.findById(noteId).select('courseId subjectId status');
        if (!note || note.status !== 'active') {
            return res.status(200).json({ success: true }); // Silent fail — don't block UI
        }

        await logNoteAccess({
            studentId: userId,
            courseId: note.courseId.toString(),
            subjectId: note.subjectId?.toString(),
            noteId: note._id!.toString(),
            action: 'print',
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// MY NOTES (Profile — grouped by Course → Subject)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notes/my-notes
 * @desc    All notes from enrolled courses, grouped by course → subject.
 *          fileUrl is NEVER included in the response.
 * @access  Private (Student)
 */
router.get('/my-notes', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '50'), 10);
        const skip = (page - 1) * limit;

        // 1. Get all paid enrollments for this student
        const enrollments = await Enrollment.find({ userId, status: 'paid' })
            .select('courseId subjectId')
            .lean();

        if (enrollments.length === 0) {
            return res.status(200).json({
                success: true,
                totalNotes: 0,
                grouped: [],
            });
        }

        const courseIds = [...new Set(enrollments.map((e: any) => e.courseId.toString()))];
        const subjectIds = enrollments
            .filter((e: any) => e.subjectId)
            .map((e: any) => e.subjectId.toString());

        // 2. Fetch accessible notes
        const query: any = {
            status: 'active',
            $or: [
                { courseId: { $in: courseIds }, subjectId: null },
                { courseId: { $in: courseIds }, subjectId: { $exists: false } },
                ...(subjectIds.length > 0 ? [{ subjectId: { $in: subjectIds } }] : []),
            ],
        };

        const notes = await Note.find(query)
            .select('-fileUrl -markdownContent')  // Never expose raw file paths
            .sort({ courseId: 1, subjectName: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalNotes = await Note.countDocuments(query);

        // 3. Fetch course titles for display
        const courseDocs = await Course.find({ _id: { $in: courseIds } })
            .select('title')
            .lean();
        const courseMap: Record<string, string> = {};
        for (const c of courseDocs as any[]) {
            courseMap[c._id.toString()] = c.title;
        }

        // 4. Group: { courseId, courseTitle, subjects: [{ subjectId, subjectName, notes[] }] }
        const grouped: Record<string, {
            courseId: string;
            courseTitle: string;
            subjects: Record<string, { subjectId: string; subjectName: string; notes: any[] }>;
        }> = {};

        for (const note of notes as any[]) {
            const cId = note.courseId.toString();
            const sId = note.subjectId?.toString() || 'general';
            const sName = note.subjectName || 'General Notes';

            if (!grouped[cId]) {
                grouped[cId] = {
                    courseId: cId,
                    courseTitle: courseMap[cId] || 'Unknown Course',
                    subjects: {},
                };
            }
            if (!grouped[cId].subjects[sId]) {
                grouped[cId].subjects[sId] = { subjectId: sId, subjectName: sName, notes: [] };
            }
            grouped[cId].subjects[sId].notes.push(note);
        }

        // Convert to array form
        const groupedArray = Object.values(grouped).map(course => ({
            courseId: course.courseId,
            courseTitle: course.courseTitle,
            subjects: Object.values(course.subjects),
        }));

        res.status(200).json({
            success: true,
            totalNotes,
            page,
            limit,
            grouped: groupedArray,
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT NOTES (Course → Subject hierarchy)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notes/courses/:courseId/subjects/:subjectId/notes
 * @desc    Notes for a specific course & subject (enrollment-gated, no fileUrl)
 * @access  Private/Public (enrollment validated for students)
 */
router.get('/courses/:courseId/subjects/:subjectId/notes', async (req: Request, res: Response, next) => {
    try {
        const { courseId, subjectId } = req.params;
        const { search, fileType, chapterId, sort } = req.query;

        console.log(`[STUDENT NOTE FETCH] courseId: ${courseId}, subjectId: ${subjectId}`);

        const courseDoc = await Course.findById(courseId).select('title subjects');
        if (!courseDoc) throw new AppError('Course not found', 404);

        const subjectDoc = (courseDoc.subjects || []).find(
            (s: any) => s._id.toString() === subjectId || s.name === subjectId
        );
        const subjectName = subjectDoc ? subjectDoc.name : '';

        // Enrollment check for students
        const requester = await getRequestUser(req);
        if (requester && requester.role === 'student') {
            const enrollment = await Enrollment.findOne({ userId: requester.id, courseId, status: 'paid' });
            if (!enrollment) {
                console.log(`[ENROLLMENT CHECK FAILED] Student ${requester.id} not enrolled in ${courseId}`);
                throw new AppError('You are not enrolled in this course.', 403);
            }
        }

        const query: any = { courseId, subjectId, status: 'active' };
        if (chapterId && chapterId !== 'all') query.chapterId = chapterId;
        if (fileType && fileType !== 'all') query.fileType = fileType;
        if (search) {
            const s = String(search);
            query.$or = [
                { title: { $regex: s, $options: 'i' } },
                { description: { $regex: s, $options: 'i' } },
                { chapterName: { $regex: s, $options: 'i' } },
                { tags: { $in: [new RegExp(s, 'i')] } },
            ];
        }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        else if (sort === 'alphabetical') sortOption = { title: 1 };

        const isPrivileged = requester && (requester.role === 'admin' || requester.role === 'teacher');

        const notes = await Note.find(query)
            .select(isPrivileged ? '' : '-fileUrl -markdownContent')
            .populate('uploadedBy', 'name')
            .sort(sortOption);

        res.status(200).json({
            success: true,
            course: { _id: courseDoc._id, title: courseDoc.title },
            subject: { _id: subjectId, name: subjectName },
            totalNotes: notes.length,
            notes,
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL NOTES LIST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notes
 * @desc    All notes (filtered by enrollment for students, fileUrl stripped)
 * @access  Public (enrollment-filtered)
 */
router.get('/', async (req: Request, res: Response, next) => {
    try {
        const requester = await getRequestUser(req);
        const isPrivileged = requester && (requester.role === 'admin' || requester.role === 'teacher');

        const query = await getAccessibleNoteQuery(req);
        const notes = await Note.find(query)
            .select(isPrivileged ? '' : '-fileUrl -markdownContent')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/notes/course/:courseId
 * @desc    Notes for a specific course (enrollment-filtered, no fileUrl for students)
 * @access  Public
 */
router.get('/course/:courseId', async (req: Request, res: Response, next) => {
    try {
        const requester = await getRequestUser(req);
        const isPrivileged = requester && (requester.role === 'admin' || requester.role === 'teacher');

        const { courseId } = req.params;
        const query = await getAccessibleNoteQuery(req, courseId);
        const notes = await Note.find(query)
            .select(isPrivileged ? '' : '-fileUrl -markdownContent')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/notes/:id/download
 * @desc    BLOCKED for students — returns 403. Admins/teachers can still download.
 * @access  Restricted
 */
router.get('/:id/download', async (req: Request, res: Response, next) => {
    try {
        const requester = await getRequestUser(req);

        // Block students entirely
        if (!requester || requester.role === 'student') {
            throw new AppError('Direct download is not allowed. Use the in-app viewer to access notes.', 403);
        }

        // Admin / Teacher can download
        const note = await Note.findById(req.params.id);
        if (!note) throw new AppError('Note not found', 404);
        if (!note.fileUrl) throw new AppError('Note does not have an attached file', 400);

        const filePath = path.join(__dirname, '../../public', note.fileUrl);
        if (!fs.existsSync(filePath)) throw new AppError('File not found on server', 404);

        res.download(filePath, note.title + path.extname(note.fileUrl));
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Single note metadata — fileUrl stripped for students
 * @access  Public (enrollment-filtered)
 */
router.get('/:id', async (req: Request, res: Response, next) => {
    try {
        const requester = await getRequestUser(req);
        const isPrivileged = requester && (requester.role === 'admin' || requester.role === 'teacher');

        const note = await Note.findById(req.params.id)
            .select(isPrivileged ? '' : '-fileUrl -markdownContent')
            .populate('uploadedBy', 'name');

        if (!note) throw new AppError('Note not found', 404);

        const { allowed } = await canAccessSingleNote(req, note);
        if (!allowed) {
            throw new AppError('You don\'t have permission to view this note.', 403);
        }

        res.status(200).json({ success: true, data: note });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / TEACHER — CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/notes
 * @desc    Create note (file upload or markdown)
 * @access  Private (Admin/Teacher)
 */
router.post('/', protect, authorize('admin', 'teacher'), fileUploadLimiter, upload.single('file'), async (req: any, res: Response, next) => {
    try {
        console.log('[ADMIN NOTE UPLOAD] Body:', req.body, 'File:', req.file?.originalname);

        const { title, description, courseId, subjectId, subjectName, chapterId, chapterName, fileType } = req.body;

        if (!courseId?.trim()) throw new AppError('Course selection is required.', 400);
        if (!subjectId?.trim()) throw new AppError('Subject selection is required.', 400);
        if (!title?.trim()) throw new AppError('Note title is required.', 400);
        if (!description?.trim()) throw new AppError('Note description is required.', 400);

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

        if (resolvedFileType === 'html') {
            if (!req.body.markdownContent) throw new AppError('Markdown content is required for HTML notes.', 400);
            noteData.fileType = 'html';
            noteData.markdownContent = req.body.markdownContent;
        } else {
            if (!req.file) throw new AppError('A PDF, TXT, or DOC file upload is required.', 400);
            noteData.fileUrl = `/notes/${req.file.filename}`;
            noteData.fileType = resolvedFileType;
        }

        const note = await Note.create(noteData);
        console.log('[NOTE CREATED]', note._id);
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
        next(error);
    }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update note
 * @access  Private (Admin/Teacher)
 */
router.put('/:id', protect, authorize('admin', 'teacher'), fileUploadLimiter, upload.single('file'), async (req: any, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) throw new AppError('Note not found', 404);

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
                    const oldPath = path.join(__dirname, '../../public', note.fileUrl);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    updateData.fileUrl = undefined;
                }
            }
        } else if (req.file) {
            if (note.fileUrl) {
                const oldPath = path.join(__dirname, '../../public', note.fileUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.fileUrl = `/notes/${req.file.filename}`;
            updateData.markdownContent = undefined;
        }

        const updatedNote = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: updatedNote });
    } catch (error) {
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
        next(error);
    }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete note + file
 * @access  Private (Admin/Teacher)
 */
router.delete('/:id', protect, authorize('admin', 'teacher'), async (req: Request, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) throw new AppError('Note not found', 404);

        if (note.fileUrl) {
            const filePath = path.join(__dirname, '../../public', note.fileUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await note.deleteOne();
        res.status(200).json({ success: true, message: 'Note deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
