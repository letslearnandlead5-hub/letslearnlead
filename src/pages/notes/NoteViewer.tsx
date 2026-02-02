import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Loader } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProtectedPDFViewer from '../../components/content/ProtectedPDFViewer';
import MarkdownViewer from '../../components/notes/MarkdownViewer';
import { noteAPI, userNoteAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: string;
    markdownContent?: string;
    courseId: {
        _id: string;
        title: string;
    };
}

const NoteViewer: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToastStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (noteId) {
            fetchNote();
            checkIfSaved();
        }
    }, [noteId]);

    const fetchNote = async () => {
        try {
            setLoading(true);
            const response: any = await noteAPI.getById(noteId!);
            setNote(response.data);
        } catch (error: any) {
            console.error('Error fetching note:', error);
            addToast({ type: 'error', message: 'Failed to load note' });
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const checkIfSaved = async () => {
        try {
            const response: any = await userNoteAPI.checkSaved(noteId!);
            setIsSaved(response.data.saved);
        } catch (error) {
            console.error('Error checking saved status:', error);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!noteId) return;

        try {
            setSaving(true);
            if (isSaved) {
                await userNoteAPI.remove(noteId);
                setIsSaved(false);
                addToast({ type: 'success', message: 'Removed from your library' });
            } else {
                await userNoteAPI.save(noteId);
                setIsSaved(true);
                addToast({ type: 'success', message: 'Saved to your library!' });
            }
        } catch (error: any) {
            console.error('Error saving note:', error);
            addToast({ type: 'error', message: error.message || 'Failed to save note' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading note...</p>
                </div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Note not found</p>
                    <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Back Button & Title */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                            >
                                Back
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                                    {note.title}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {note.courseId.title}
                                </p>
                            </div>
                        </div>

                        {/* Right: Save Button */}
                        <Button
                            variant={isSaved ? 'outline' : 'primary'}
                            size="sm"
                            onClick={handleSaveToLibrary}
                            disabled={saving}
                            leftIcon={
                                isSaved ? (
                                    <BookmarkCheck className="w-4 h-4" />
                                ) : (
                                    <BookmarkPlus className="w-4 h-4" />
                                )
                            }
                        >
                            {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save to Library'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-6">
                {/* Note Content */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                    {note.fileType === 'html' && note.markdownContent ? (
                        <div className="p-8">
                            <MarkdownViewer content={note.markdownContent} />
                        </div>
                    ) : note.fileUrl ? (
                        note.fileType === 'pdf' || note.fileUrl.endsWith('.pdf') ? (
                            <ProtectedPDFViewer
                                fileUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${note.fileUrl
                                    }`}
                                fileName={note.title}
                                className="min-h-screen"
                            />
                        ) : (
                            <iframe
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${note.fileUrl
                                    }`}
                                className="w-full min-h-screen border-0"
                                title={note.title}
                            />
                        )
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-gray-600 dark:text-gray-400">Content not available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteViewer;
