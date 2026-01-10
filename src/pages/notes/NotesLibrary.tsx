import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye, FileText, FolderOpen, Plus, Edit, Trash2, Filter, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import NoteForm from '../../components/notes/NoteForm';
import MarkdownViewer from '../../components/notes/MarkdownViewer';
import { noteAPI, courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: string;
    markdownContent?: string;
    tags?: string[];
    category?: string;
    courseId: { _id: string; title: string };
    uploadedBy: { _id: string; name: string };
    createdAt: string;
}

const NotesLibrary: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formInitialData, setFormInitialData] = useState<any>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { addToast } = useToastStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchNotes();
        fetchCourses();
    }, [selectedCourse, selectedType, selectedCategory, searchTerm]);

    const fetchNotes = async () => {
        try {
            const params: any = {};
            if (selectedCourse !== 'all') params.courseId = selectedCourse;
            if (selectedType !== 'all') params.fileType = selectedType;
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (searchTerm) params.search = searchTerm;

            const response = await noteAPI.getAll(params);
            setNotes(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notes:', error);
            addToast({ type: 'error', message: 'Failed to load notes' });
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleViewNote = (note: Note) => {
        setSelectedNote(note);
        setIsViewerOpen(true);
    };

    const handleCreateNote = () => {
        setFormInitialData(null);
        setIsFormOpen(true);
    };

    const handleEditNote = (note: Note) => {
        setFormInitialData({
            title: note.title,
            description: note.description,
            markdownContent: note.markdownContent || '',
            courseId: note.courseId._id,
            fileType: note.fileType,
            category: note.category || '',
            tags: note.tags || [],
        });
        setSelectedNote(note);
        setIsFormOpen(true);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        try {
            await noteAPI.delete(noteId);
            addToast({ type: 'success', message: 'Note deleted successfully!' });
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            addToast({ type: 'error', message: 'Failed to delete note' });
        }
    };

    const handleFormSubmit = async (noteData: any) => {
        try {
            if (selectedNote) {
                await noteAPI.update(selectedNote._id, noteData);
                addToast({ type: 'success', message: 'Note updated successfully!' });
            } else {
                await noteAPI.create(noteData);
                addToast({ type: 'success', message: 'Note created successfully!' });
            }
            setIsFormOpen(false);
            setSelectedNote(null);
            fetchNotes();
        } catch (error: any) {
            console.error('Error saving note:', error);
            addToast({ type: 'error', message: error.message || 'Failed to save note' });
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCourse('all');
        setSelectedType('all');
        setSelectedCategory('all');
    };

    const activeFiltersCount =
        (searchTerm ? 1 : 0) +
        (selectedCourse !== 'all' ? 1 : 0) +
        (selectedType !== 'all' ? 1 : 0) +
        (selectedCategory !== 'all' ? 1 : 0);

    const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                                Study <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Materials</span>
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                Access and manage your course notes and study materials
                            </p>
                        </div>
                        {user?.role === 'admin' && (
                            <Button 
                                variant="primary" 
                                leftIcon={<Plus className="w-5 h-5" />} 
                                onClick={handleCreateNote}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Create Note
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 space-y-4"
                >
                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search notes by title, description, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-600 transition-colors">
                            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-gray-900 dark:text-white">Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                                <span>Clear all filters</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-lg">
                            {/* Course Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    📚 Filter by Course
                                </label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                    <option value="all">All Courses</option>
                                    {courses.map((course) => (
                                        <option key={course._id} value={course._id}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Type Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    📄 Filter by Type
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {['all', 'markdown', 'pdf', 'document', 'text'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${selectedType === type
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter */}
                            {categories.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                                        🏷️ Filter by Category
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${selectedCategory === 'all'
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}>
                                            All Categories
                                        </button>
                                        {categories.map((cat: any) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${selectedCategory === cat
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                {/* Results Count */}
                {notes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                    >
                        <p className="text-gray-900 dark:text-white font-medium">
                            📖 Showing <span className="text-blue-600 dark:text-blue-400 font-bold">{notes.length}</span> note{notes.length !== 1 ? 's' : ''}
                            {activeFiltersCount > 0 && <span className="text-gray-500 dark:text-gray-400"> (filtered)</span>}
                        </p>
                    </motion.div>
                )}

                {/* Notes Grid */}
                {notes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {activeFiltersCount > 0 ? 'No notes match your filters' : 'No notes yet'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                                {activeFiltersCount > 0 ? 'Try adjusting your search or filters to find what you\'re looking for' : 'Create your first note to get started with your study materials!'}
                            </p>
                            {user?.role === 'admin' && (
                                <Button 
                                    variant="primary" 
                                    leftIcon={<Plus className="w-5 h-5" />} 
                                    onClick={handleCreateNote}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    Create Your First Note
                                </Button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map((note, index) => (
                            <motion.div
                                key={note._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -8 }}
                            >
                                <Card className="p-6 h-full flex flex-col bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-300 rounded-2xl">
                                    {/* Header with Icon */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${
                                            note.fileType === 'markdown' 
                                                ? 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900' 
                                                : 'bg-gradient-to-br from-green-100 to-cyan-100 dark:from-green-900 dark:to-cyan-900'
                                        }`}>
                                            {note.fileType === 'markdown' ? (
                                                <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <FolderOpen className="w-7 h-7 text-green-600 dark:text-green-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                                                {note.title}
                                            </h3>
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                📚 {note.courseId.title}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1 line-clamp-3">
                                        {note.description}
                                    </p>

                                    {/* Tags and Badges */}
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        <Badge variant={note.fileType === 'pdf' ? 'danger' : 'primary'} className="font-semibold">
                                            {note.fileType.toUpperCase()}
                                        </Badge>
                                        {note.category && (
                                            <Badge variant="secondary" className="font-semibold">
                                                {note.category}
                                            </Badge>
                                        )}
                                        {note.tags && note.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-blue-700 dark:text-blue-300 rounded-lg font-medium border border-blue-200 dark:border-blue-800">
                                                #{tag}
                                            </span>
                                        ))}
                                        {note.tags && note.tags.length > 2 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                +{note.tags.length - 2} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                            onClick={() => handleViewNote(note)}
                                            leftIcon={<Eye className="w-4 h-4" />}>
                                            View
                                        </Button>
                                        {user && (user.role === 'admin' || note.uploadedBy._id === user.id) && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditNote(note)}
                                                    className="border-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteNote(note._id)}
                                                    className="border-2 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-500 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Note Viewer Modal */}
                <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title={selectedNote?.title || ''} size="full">
                    <div className="min-h-[60vh]">
                        {selectedNote?.fileType === 'markdown' && selectedNote.markdownContent ? (
                            <div className="p-6">
                                <MarkdownViewer content={selectedNote.markdownContent} />
                            </div>
                        ) : selectedNote?.fileUrl ? (
                            <div className="flex flex-col h-full">
                                {/* File Viewer */}
                                <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto">
                                    {(() => {
                                        const fileExtension = selectedNote.fileUrl.split('.').pop()?.toLowerCase();
                                        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                                        const fileUrl = `${baseUrl}${selectedNote.fileUrl}`;
                                        
                                        // PDF Viewer - Use object tag for better compatibility
                                        if (fileExtension === 'pdf') {
                                            return (
                                                <div className="w-full h-[70vh] bg-gray-200 dark:bg-gray-800">
                                                    <object
                                                        data={fileUrl}
                                                        type="application/pdf"
                                                        className="w-full h-full"
                                                    >
                                                        <div className="flex items-center justify-center h-full">
                                                            <div className="text-center p-8">
                                                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                                    Your browser doesn't support PDF viewing.
                                                                </p>
                                                                <a
                                                                    href={fileUrl}
                                                                    download
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Button variant="primary" leftIcon={<Download className="w-5 h-5" />}>
                                                                        Download PDF
                                                                    </Button>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </object>
                                                </div>
                                            );
                                        }
                                        
                                        // Image Viewer
                                        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                                            return (
                                                <div className="flex items-center justify-center p-8 min-h-[60vh]">
                                                    <img
                                                        src={fileUrl}
                                                        alt={selectedNote.title}
                                                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                                                    />
                                                </div>
                                            );
                                        }
                                        
                                        // Text File Viewer
                                        if (['txt', 'text'].includes(fileExtension || '')) {
                                            return (
                                                <div className="p-8">
                                                    <iframe
                                                        src={fileUrl}
                                                        className="w-full h-[60vh] border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                                        title={selectedNote.title}
                                                    />
                                                </div>
                                            );
                                        }
                                        
                                        // Document files (DOC, DOCX) - Show download option
                                        return (
                                            <div className="flex items-center justify-center h-[60vh]">
                                                <div className="text-center">
                                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                        Document File
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                                        {selectedNote.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                                                        This file type cannot be previewed in the browser
                                                    </p>
                                                    <a
                                                        href={fileUrl}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button 
                                                            variant="primary" 
                                                            leftIcon={<Download className="w-5 h-5" />}
                                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                        >
                                                            Download File
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {/* Download Button Footer */}
                                {(() => {
                                    const fileExtension = selectedNote.fileUrl.split('.').pop()?.toLowerCase();
                                    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                                    const fileUrl = `${baseUrl}${selectedNote.fileUrl}`;
                                    
                                    // Show download button for viewable files
                                    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'text'].includes(fileExtension || '')) {
                                        return (
                                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">File Type:</span> {fileExtension?.toUpperCase()}
                                                    </div>
                                                    <a
                                                        href={fileUrl}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            leftIcon={<Download className="w-4 h-4" />}
                                                            className="border-2"
                                                        >
                                                            Download
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[60vh]">
                                <div className="text-center">
                                    <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No Content Available</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        This note doesn't have any content to display
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Note Form Modal */}
                <Modal
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setSelectedNote(null);
                    }}
                    title={selectedNote ? 'Edit Note' : 'Create Note'}
                    size="xl">
                    <NoteForm
                        initialData={formInitialData}
                        courses={courses}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setIsFormOpen(false);
                            setSelectedNote(null);
                        }}
                    />
                </Modal>
            </div>
        </div>
    );
};

export default NotesLibrary;
