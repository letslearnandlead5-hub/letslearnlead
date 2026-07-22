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

/**
 * Resolves a note's fileUrl to an absolute disk path on the server.
 * Handles legacy URLs (http://...), relative paths (/notes/...), and alternative dirs.
 */
function resolveNoteFilePath(fileUrl?: string): { filePath: string | null; errorDetails?: string } {
    if (!fileUrl) return { filePath: null, errorDetails: 'Note fileUrl is empty or not attached.' };

    // Strip hostname if fileUrl is a full URL (e.g. http://localhost:5000/notes/xyz.pdf -> /notes/xyz.pdf)
    let cleanPath = fileUrl.replace(/^https?:\/\/[^\/]+/, '');
    if (cleanPath.startsWith('/public')) cleanPath = cleanPath.replace('/public', '');
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    const candidates = [
        path.join(__dirname, '../../public', cleanPath),
        path.join(__dirname, '../../public/notes', path.basename(cleanPath)),
        path.join(__dirname, '../../uploads/notes', path.basename(cleanPath)),
        path.join(process.cwd(), 'public', cleanPath),
        path.join(process.cwd(), 'public/notes', path.basename(cleanPath)),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return { filePath: candidate };
        }
    }

    return {
        filePath: null,
        errorDetails: `File missing on disk. Stored URL: "${fileUrl}". Searched paths: ${candidates.join(', ')}`,
    };
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
        if (courseIds.length > 0) accessFilters.push({ courseId: { $in: courseIds } });
        filters.push(accessFilters.length > 0 ? { $or: accessFilters } : { _id: { $exists: false } });
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];
    return { $and: filters };
}

/**
 * Access Control Evaluator for a Single Note:
 * Grants access if:
 * 1. User is Admin or Teacher.
 * 2. Student is enrolled at Course level (courseIds.has(noteCourseId)) -> Grants access to ALL subjects/notes in that course!
 * 3. Student is enrolled at Subject level (subjectIds.has(noteSubjectId)).
 */
async function canAccessSingleNote(req: Request, note: any): Promise<{ allowed: boolean; studentId?: string }> {
    const requester = await getRequestUser(req);
    if (!requester) return { allowed: false };
    if (requester.role === 'admin' || requester.role === 'teacher') return { allowed: true };

    const noteCourseId = note.courseId?.toString();
    const noteSubjectId = note.subjectId?.toString();

    const studentAccess = await getStudentNoteAccess(req, noteCourseId);
    if (!studentAccess) return { allowed: true };

    const hasCourseAccess = noteCourseId ? studentAccess.courseIds.has(noteCourseId) : false;
    const hasSubjectAccess = noteSubjectId ? studentAccess.subjectIds.has(noteSubjectId) : false;

    const allowed = hasCourseAccess || hasSubjectAccess;

    console.log(`[CAN ACCESS NOTE] studentId=${requester.id} noteId=${note._id} courseId=${noteCourseId} subjectId=${noteSubjectId} hasCourseAccess=${hasCourseAccess} hasSubjectAccess=${hasSubjectAccess} => ALLOWED=${allowed}`);

    return { allowed, studentId: requester.id };
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
        console.log(`[NOTE ACCESS LOG] action=${params.action} studentId=${params.studentId} noteId=${params.noteId} courseId=${params.courseId}`);
    } catch (err) {
        console.error('[NOTE ACCESS LOG ERROR]', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SECURE VIEW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/notes/:noteId/view
 * @desc    Issue a short-lived signed view token for an enrolled student.
 *          Never exposes fileUrl. Returns HTTP 403 if not enrolled. Returns HTTP 404 only if note does not exist in DB.
 * @access  Private (Student / Admin / Teacher)
 */
router.get('/:noteId/view', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { noteId } = req.params;
        const userId = req.user?.id;

        console.log(`[NOTE VIEW REQUEST] noteId=${noteId} userId=${userId}`);

        const note = await Note.findById(noteId);
        if (!note) {
            throw new AppError('Note not found', 404);
        }
        if (note.status !== 'active') {
            throw new AppError('Note is currently inactive', 403);
        }

        const { allowed, studentId } = await canAccessSingleNote(req, note);
        if (!allowed) {
            console.warn(`[NOTE ACCESS DENIED] studentId=${userId} not enrolled in courseId=${note.courseId}`);
            throw new AppError('You are not enrolled in this course.', 403);
        }

        const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'teacher';

        // Generate short-lived view token (5 minutes)
        const payload: NoteViewTokenPayload = {
            noteId: note._id!.toString(),
            studentId: userId,
            action: 'view',
        };

        const viewToken = jwt.sign(payload, NOTE_VIEW_TOKEN_SECRET, {
            expiresIn: NOTE_VIEW_TOKEN_TTL,
        });

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
 *          the note file inline.
 * @access  Via short-lived token
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
                isExpired ? 'View session has expired. Please request a new token.' : 'Invalid view token.',
                401
            );
        }

        if (decoded.noteId !== noteId) {
            throw new AppError('Token does not match this note.', 403);
        }

        const note = await Note.findById(noteId);
        if (!note || note.status !== 'active') {
            throw new AppError('Note not found or inactive', 404);
        }

        // ── HTML/Markdown notes: serve inline HTML ──────────────────────────
        if (note.fileType === 'html' && note.markdownContent) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Disposition', 'inline');

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

        // ── File-based notes: resolve disk path & stream ─────────────────────
        const resolved = resolveNoteFilePath(note.fileUrl);
        if (!resolved.filePath) {
            console.error(`[NOTE FILE MISSING] noteId=${note._id} ${resolved.errorDetails}`);
            return res.status(404).json({
                success: false,
                code: 'FILE_MISSING',
                message: 'Note file missing on server.',
            });
        }

        const filePath = resolved.filePath;
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain; charset=utf-8',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const contentType = mimeTypes[ext] || 'application/pdf';

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(note.title)}${ext}"`);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Download-Options', 'noopen');

        await logNoteAccess({
            studentId: decoded.studentId,
            courseId: note.courseId.toString(),
            subjectId: note.subjectId?.toString(),
            noteId: note._id!.toString(),
            action: 'view',
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });

        console.log(`[NOTE STREAM GRANTED] studentId=${decoded.studentId} noteId=${note._id} filePath=${filePath} size=${fileSize}`);

        // Handle HTTP Range Requests for fast streaming of large PDFs
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Content-Length', chunksize);
            return file.pipe(res);
        } else {
            res.setHeader('Content-Length', fileSize);
            const file = fs.createReadStream(filePath);
            return file.pipe(res);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/notes/:noteId/print-log
 * @desc    Log student print action
 * @access  Private
 */
router.post('/:noteId/print-log', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { noteId } = req.params;
        const userId = req.user?.id;

        const note = await Note.findById(noteId).select('courseId subjectId status');
        if (!note || note.status !== 'active') {
            return res.status(200).json({ success: true });
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
 * @access  Private (Student)
 */
router.get('/my-notes', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || '50'), 10);
        const skip = (page - 1) * limit;

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

        const query: any = {
            status: 'active',
            $or: [
                { courseId: { $in: courseIds } },
                ...(subjectIds.length > 0 ? [{ subjectId: { $in: subjectIds } }] : []),
            ],
        };

        const notes = await Note.find(query)
            .select('-fileUrl -markdownContent')
            .sort({ courseId: 1, subjectName: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalNotes = await Note.countDocuments(query);

        const courseDocs = await Course.find({ _id: { $in: courseIds } })
            .select('title')
            .lean();
        const courseMap: Record<string, string> = {};
        for (const c of courseDocs as any[]) {
            courseMap[c._id.toString()] = c.title;
        }

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
 * @desc    Notes for a specific course & subject (enrollment-gated)
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

router.get('/:id/download', async (req: Request, res: Response, next) => {
    try {
        const requester = await getRequestUser(req);

        if (!requester || requester.role === 'student') {
            throw new AppError('Direct download is not allowed. Use the in-app viewer to access notes.', 403);
        }

        const note = await Note.findById(req.params.id);
        if (!note) throw new AppError('Note not found', 404);

        const resolved = resolveNoteFilePath(note.fileUrl);
        if (!resolved.filePath) throw new AppError('Note file missing on server', 404);

        res.download(resolved.filePath, note.title + path.extname(resolved.filePath));
    } catch (error) {
        next(error);
    }
});

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
            throw new AppError('You are not enrolled in this course.', 403);
        }

        res.status(200).json({ success: true, data: note });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / TEACHER — CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', protect, authorize('admin', 'teacher'), fileUploadLimiter, upload.single('file'), async (req: any, res: Response, next) => {
    try {
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
        console.log('[NOTE CREATED]', note._id, 'fileUrl:', note.fileUrl);
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
        next(error);
    }
});

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

router.delete('/:id', protect, authorize('admin', 'teacher'), async (req: Request, res: Response, next) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) throw new AppError('Note not found', 404);

        if (note.fileUrl) {
            const resolved = resolveNoteFilePath(note.fileUrl);
            if (resolved.filePath && fs.existsSync(resolved.filePath)) {
                fs.unlinkSync(resolved.filePath);
            }
        }

        await note.deleteOne();
        res.status(200).json({ success: true, message: 'Note deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
