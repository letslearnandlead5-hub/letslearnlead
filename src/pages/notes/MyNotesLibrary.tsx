import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Search,
    FileText,
    Trash2,
    Eye,
    Clock,
    Calendar,
    FolderOpen,
    Download,
    BookmarkCheck,
    Filter,
    X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { userNoteAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { staggerContainer, staggerItem } from '../../utils/animations';
import MarkdownViewer from '../../components/notes/MarkdownViewer';
import ProtectedPDFViewer from '../../components/content/ProtectedPDFViewer';

interface SavedNote {
    _id: string;
    userId: string;
    noteId: {
        _id: string;
        title: string;
        description: string;
        fileUrl?: string;
        fileType: string;
        markdownContent?: string;
        courseId: {
            _id: string;
            title: string;
            thumbnail?: string;
        };
    };
    savedAt: string;
    lastViewed?: string;
    viewCount: number;
    category: string;
}

const MyNotesLibrary: React.FC = () => {
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<SavedNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const navigate = useNavigate();
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchSavedNotes();
    }, []);

    useEffect(() => {
        filterNotes();
    }, [savedNotes, searchTerm, selectedCategory, selectedCourse]);

    const fetchSavedNotes = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching saved notes...');
            const response: any = await userNoteAPI.getAll();
            console.log('📥 Saved notes response:', response);
            
            // Filter out any notes with missing data
            const validNotes = (response.data || []).filter((note: SavedNote) => {
                if (!note.noteId) {
                    console.warn('Note missing noteId:', note);
                    return false;
                }
                if (!note.noteId.courseId) {
                    console.warn('Note missing courseId:', note);
                    return false;
                }
                return true;
            });
            
            setSavedNotes(validNotes);
            console.log(`✅ Loaded ${validNotes.length} valid notes`);
        } catch (error: any) {
            console.error('❌ Error fetching saved notes:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.status
            });
            addToast({ type: 'error', message: error.message || 'Failed to load saved notes' });
            setSavedNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const filterNotes = () => {
        let filtered = [...savedNotes];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (note) =>
                    note.noteId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    note.noteId?.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter((note) => note.category === selectedCategory);
        }

        // Filter by course
        if (selectedCourse !== 'all') {
            filtered = filtered.filter((note) => note.noteId?.courseId?._id === selectedCourse);
        }

        setFilteredNotes(filtered);
    };

    const handleRemoveNote = async (noteId: string) => {
        if (!confirm('Are you sure you want to remove this note from your library?')) {
            return;
        }

        try {
            await userNoteAPI.remove(noteId);
            setSavedNotes(savedNotes.filter((note) => note._id !== noteId));
            addToast({ type: 'success', message: 'Note removed from your library' });
        } catch (error: any) {
            console.error('Error removing note:', error);
            addToast({ type: 'error', message: 'Failed to remove note' });
        }
    };

    const handleViewNote = async (note: SavedNote) => {
        // Update view count
        try {
            await userNoteAPI.markViewed(note._id);
            // Update local state
            setSavedNotes(
                savedNotes.map((n) =>
                    n._id === note._id
                        ? {
                            ...n,
                            lastViewed: new Date().toISOString(),
                            viewCount: n.viewCount + 1,
                        }
                        : n
                )
            );
        } catch (error) {
            console.error('Error updating view count:', error);
        }

        // Navigate to full-page viewer
        navigate(`/notes/view/${note.noteId._id}`);
    };

    const getUniqueCategories = () => {
        const categories = savedNotes.map((note) => note.category);
        return ['all', ...Array.from(new Set(categories))];
    };

    const getUniqueCourses = () => {
        const courses = savedNotes.map((note) => ({
            _id: note.noteId.courseId._id,
            title: note.noteId.courseId.title,
        }));
        const uniqueCourses = courses.filter(
            (course, index, self) => index === self.findIndex((c) => c._id === course._id)
        );
        return uniqueCourses;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const stats = {
        total: savedNotes.length,
        recentlyViewed: savedNotes.filter(
            (n) => n.lastViewed && new Date(n.lastViewed).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
        categories: getUniqueCategories().filter((c) => c !== 'all').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        My Notes Library
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your saved study materials - accessible anytime you're logged in
                    </p>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <BookmarkCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Saved</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Recently Viewed
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.recentlyViewed}
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.categories}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Course Filter */}
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Courses</option>
                            {getUniqueCourses().map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {getUniqueCategories().map((category) => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <BookmarkCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {savedNotes.length === 0
                                ? 'No saved notes yet'
                                : 'No notes match your filters'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {savedNotes.length === 0
                                ? 'Save notes from your courses to access them here anytime'
                                : 'Try adjusting your search or filters'}
                        </p>
                    </Card>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredNotes.map((note) => (
                            <motion.div key={note._id} variants={staggerItem}>
                                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="p-6">
                                        {/* Course Badge */}
                                        <Badge variant="primary" className="mb-3">
                                            {note.noteId?.courseId?.title || 'Unknown Course'}
                                        </Badge>

                                        {/* Note Title */}
                                        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">
                                            {note.noteId?.title || 'Untitled Note'}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {note.noteId?.description || 'No description available'}
                                        </p>

                                        {/* Metadata */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <FileText className="w-3 h-3" />
                                                <span>{note.noteId?.fileType?.toUpperCase() || 'FILE'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                <span>Saved on {formatDate(note.savedAt)}</span>
                                            </div>
                                            {note.lastViewed && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        Last viewed {formatDate(note.lastViewed)} ({note.viewCount}{' '}
                                                        {note.viewCount === 1 ? 'view' : 'views'})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Category */}
                                        <Badge variant="secondary" className="mb-4">
                                            <FolderOpen className="w-3 h-3 mr-1" />
                                            {note.category || 'Uncategorized'}
                                        </Badge>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1"
                                                leftIcon={<Eye className="w-4 h-4" />}
                                                onClick={() => handleViewNote(note)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveNote(note._id)}
                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
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
