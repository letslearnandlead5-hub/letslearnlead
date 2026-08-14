import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Search,
    FileText,
    Trash2,
    Eye,
    Clock,
    FolderOpen,
    BookmarkCheck,
    Filter,
    X,
    GraduationCap,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { userNoteAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface SavedNote {
    _id: string;
    userId: string;
    noteId: {
        _id: string;
        title: string;
        description: string;
        fileUrl?: string;
        fileType: string;
        subjectName?: string;
        chapterName?: string;
        courseId: {
            _id: string;
            title: string;
            thumbnail?: string;
        };
    };
    savedAt: string;
    lastViewed?: string;
    viewCount: number;
}

const MyNotesLibrary: React.FC = () => {
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchSavedNotes();
    }, []);

    const fetchSavedNotes = async () => {
        try {
            setLoading(true);
            const response: any = await userNoteAPI.getAll();
            const validNotes = (response.data || []).filter((note: SavedNote) => {
                return note.noteId && note.noteId.courseId;
            });
            setSavedNotes(validNotes);
        } catch (error: any) {
            console.error('Error fetching saved notes:', error);
            addToast({ type: 'error', message: error?.message || 'Failed to load saved notes' });
            setSavedNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNote = async (userNoteId: string) => {
        try {
            await userNoteAPI.remove(userNoteId);
            setSavedNotes((prev) => prev.filter((n) => n._id !== userNoteId));
            addToast({ type: 'success', message: 'Note removed from your saved library' });
        } catch (error: any) {
            console.error('Error removing note:', error);
            addToast({ type: 'error', message: error?.message || 'Failed to remove note' });
        }
    };

    // Unique courses extracted from saved notes
    const uniqueCourses = useMemo(() => {
        const map = new Map<string, string>();
        savedNotes.forEach((n) => {
            if (n.noteId?.courseId?._id) {
                map.set(n.noteId.courseId._id, n.noteId.courseId.title);
            }
        });
        return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
    }, [savedNotes]);

    // Unique subjects extracted from saved notes
    const uniqueSubjects = useMemo(() => {
        const set = new Set<string>();
        savedNotes.forEach((n) => {
            if (n.noteId?.subjectName) {
                set.add(n.noteId.subjectName);
            }
        });
        return Array.from(set);
    }, [savedNotes]);

    // Filter notes
    const filteredNotes = useMemo(() => {
        return savedNotes.filter((note) => {
            const titleMatch = !searchTerm || note.noteId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.noteId?.chapterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.noteId?.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());

            const courseMatch = selectedCourse === 'all' || note.noteId?.courseId?._id === selectedCourse;
            const subjectMatch = selectedSubject === 'all' || note.noteId?.subjectName === selectedSubject;

            return titleMatch && courseMatch && subjectMatch;
        });
    }, [savedNotes, searchTerm, selectedCourse, selectedSubject]);

    const activeFiltersCount =
        (searchTerm ? 1 : 0) +
        (selectedCourse !== 'all' ? 1 : 0) +
        (selectedSubject !== 'all' ? 1 : 0);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCourse('all');
        setSelectedSubject('all');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Saved Notes Library
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Access your bookmarked study notes and chapter materials
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            <BookmarkCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Saved Notes</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{savedNotes.length}</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Courses</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueCourses.length}</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Recently Saved</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {savedNotes.filter((n) => {
                                    const diff = (Date.now() - new Date(n.savedAt).getTime()) / (1000 * 60 * 60 * 24);
                                    return diff <= 7;
                                }).length}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by title, subject, or chapter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Course Filter */}
                        {uniqueCourses.length > 0 && (
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Courses</option>
                                {uniqueCourses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Subject Filter */}
                        {uniqueSubjects.length > 0 && (
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">All Subjects</option>
                                {uniqueSubjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        )}

                        {activeFiltersCount > 0 && (
                            <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                                Clear
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <BookmarkCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No Saved Notes Found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                            {activeFiltersCount > 0
                                ? 'No saved notes match your filters. Try clearing search or filters.'
                                : 'You have not saved any study notes yet. Browse your subject notes and click "Save" on any note to bookmark it here.'}
                        </p>
                        <Button variant="primary" onClick={() => navigate('/dashboard/?tab=subject-notes')}>
                            Browse Subject Notes
                        </Button>
                    </Card>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {filteredNotes.map((note) => (
                            <motion.div key={note._id} variants={staggerItem}>
                                <Card className="h-full flex flex-col p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 flex-shrink-0">
                                            {note.noteId.fileType === 'html' ? (
                                                <FileText className="w-5 h-5" />
                                            ) : (
                                                <FolderOpen className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
                                                {note.noteId.title}
                                            </h3>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {note.noteId.courseId?.title || 'Course'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject & Chapter Tags */}
                                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                        {note.noteId.subjectName && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                                                📚 {note.noteId.subjectName}
                                            </span>
                                        )}
                                        {note.noteId.chapterName && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                📌 {note.noteId.chapterName}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 uppercase ml-auto">
                                            {note.noteId.fileType?.toUpperCase()}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
                                        {note.noteId.description}
                                    </p>

                                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            leftIcon={<Eye className="w-4 h-4" />}
                                            onClick={() => navigate(`/notes/view/${note.noteId._id}/`)}
                                        >
                                            View Note
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-red-600 hover:text-red-700"
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                            onClick={() => handleDeleteNote(note._id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyNotesLibrary;
