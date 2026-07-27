import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Loader, Lock, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProtectedPDFViewer from '../../components/content/ProtectedPDFViewer';
import MarkdownViewer from '../../components/notes/MarkdownViewer';
import { noteAPI, userNoteAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

interface NoteCourse {
    _id: string;
    title: string;
}

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    streamUrl?: string;
    viewToken?: string;
    fileType: string;
    markdownContent?: string;
    courseId?: NoteCourse | string;
    subjectId?: string;
    subjectName?: string;
    chapterName?: string;
}

interface FetchError {
    status: number;
    message: string;
    code?: string;
}

const NoteViewer: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FetchError | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [savedUserNoteId, setSavedUserNoteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToastStore();
    const { isAuthenticated } = useAuthStore();

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (noteId) {
            fetchNote();
            if (isAuthenticated) {
                checkIfSaved();
            }
        }
    }, [noteId, isAuthenticated]);

    const fetchNote = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`[NOTE VIEWER] Fetching noteId=${noteId}`);

            const response: any = await noteAPI.getById(noteId!);
            const noteData = response?.data || response?.note || response;

            if (!noteData || !noteData._id) {
                throw { status: 404, message: 'Note not found or invalid format.' };
            }

            console.log('[NOTE VIEWER LOADED]', {
                noteId: noteData._id,
                title: noteData.title,
                fileType: noteData.fileType,
                hasMarkdown: !!noteData.markdownContent,
                hasFileUrl: !!noteData.fileUrl,
                hasStreamUrl: !!noteData.streamUrl,
            });

            setNote(noteData);
        } catch (err: any) {
            console.error('[NOTE VIEWER FETCH ERROR]', err);
            const status = err?.status || err?.response?.status || (err?.message?.includes('403') ? 403 : 500);
            const message = err?.response?.data?.message || err?.message || 'Failed to load note document.';
            const code = err?.response?.data?.code || err?.code;

            setError({ status, message, code });
        } finally {
            setLoading(false);
        }
    };

    const checkIfSaved = async () => {
        try {
            const response: any = await userNoteAPI.checkSaved(noteId!);
            setIsSaved(!!response.isSaved);
            setSavedUserNoteId(response.data?._id || null);
        } catch (err) {
            console.error('Error checking saved status:', err);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!noteId) return;

        try {
            setSaving(true);
            if (isSaved) {
                if (!savedUserNoteId) {
                    await checkIfSaved();
                    return;
                }
                await userNoteAPI.remove(savedUserNoteId);
                setIsSaved(false);
                setSavedUserNoteId(null);
                addToast({ type: 'success', message: 'Removed from your library' });
            } else {
                const response: any = await userNoteAPI.save(noteId);
                setIsSaved(true);
                setSavedUserNoteId(response.data?._id || null);
                addToast({ type: 'success', message: 'Saved to your library!' });
            }
        } catch (err: any) {
            console.error('Error saving note:', err);
            addToast({ type: 'error', message: err.message || 'Failed to save note' });
        } finally {
            setSaving(false);
        }
    };

    // ── LOADING STATE ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <Loader className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">Preparing document viewer...</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Verifying your enrollment access</p>
            </div>
        );
    }

    // ── ERROR / ACCESS DENIED STATES ─────────────────────────────────────────
    if (error) {
        if (error.status === 403) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 rounded-full flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                            {error.message || 'You are not enrolled in this course. Please enroll in the course to unlock full access to all subject notes.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                variant="primary"
                                className="w-full justify-center"
                                leftIcon={<BookOpen className="w-4 h-4" />}
                                onClick={() => navigate('/courses/')}
                            >
                                Browse Courses
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                                onClick={() => navigate(-1)}
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        if (error.status === 401) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-600 dark:text-amber-400">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Please log in with your student account to view protected course notes.
                        </p>
                        <Button
                            variant="primary"
                            className="w-full justify-center"
                            onClick={() => navigate('/login/')}
                        >
                            Log In
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Document Unavailable</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                        {error.message || 'Unable to load note document.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="primary"
                            className="w-full justify-center"
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                            onClick={fetchNote}
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-center"
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!note) return null;

    const courseTitle = typeof note.courseId === 'object' && note.courseId?.title ? note.courseId.title : 'Course Notes';

    // Construct stream URL for PDF or raw files
    const pdfSrc = note.streamUrl
        ? (note.streamUrl.startsWith('http') ? note.streamUrl : `${API_BASE_URL}${note.streamUrl}`)
        : note.fileUrl
        ? (note.fileUrl.startsWith('http') ? note.fileUrl : `${API_BASE_URL}${note.fileUrl}`)
        : '';

    const isPdfNote = note.fileType === 'pdf' || note.fileType === 'file' || (note.fileUrl && note.fileUrl.endsWith('.pdf')) || !!pdfSrc;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header Navbar */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="px-3 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Back Button & Metadata */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                                className="flex-shrink-0"
                            >
                                <span className="hidden sm:inline">Back</span>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                    {note.title}
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {courseTitle} {note.subjectName ? `• ${note.subjectName}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Right: Save Button */}
                        {isAuthenticated && (
                            <Button
                                variant={isSaved ? 'outline' : 'primary'}
                                size="sm"
                                onClick={handleSaveToLibrary}
                                disabled={saving}
                                leftIcon={
                                    isSaved ? (
                                        <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                        <BookmarkPlus className="w-4 h-4" />
                                    )
                                }
                                className="flex-shrink-0"
                            >
                                <span className="hidden sm:inline">
                                    {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save to Library'}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Content View */}
            {note.fileType === 'html' && note.markdownContent ? (
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden p-6 sm:p-10">
                        <MarkdownViewer content={note.markdownContent} />
                    </div>
                </div>
            ) : isPdfNote && pdfSrc ? (
                <ProtectedPDFViewer
                    fileUrl={pdfSrc}
                    fileName={note.title}
                />
            ) : (
                <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Content Attached</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This note has been created but no file or markdown text has been uploaded by the instructor yet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteViewer;
