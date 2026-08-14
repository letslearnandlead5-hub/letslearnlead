import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Eye, FileText, Filter, X, Download, Copy, BookOpen } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import NoteForm from '../../components/notes/NoteForm';
import MarkdownViewer from '../../components/notes/MarkdownViewer';
import MultiCourseSelector from '../../components/admin/MultiCourseSelector';
import { noteAPI, courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: string;
    markdownContent?: string;
    tags?: string[];
    chapterName?: string;
    chapterId?: string;
    subjectId?: string;
    subjectName?: string;
    status?: 'active' | 'inactive';
    courseId: { _id: string; title: string };
    uploadedBy: { _id: string; name: string };
    createdAt: string;
}

const NotesManagement: React.FC = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Multi-course copy state
    const [copyModalNote, setCopyModalNote] = useState<Note | null>(null);
    const [targetCopyCourseIds, setTargetCopyCourseIds] = useState<string[]>([]);
    const [copying, setCopying] = useState(false);

    const { addToast } = useToastStore();

    // Available subjects for the selected course filter
    const availableSubjects = useMemo(() => {
        if (selectedCourse === 'all') return [];
        const course = courses.find((c) => (c._id || c.id) === selectedCourse);
        return course?.subjects || [];
    }, [courses, selectedCourse]);

    useEffect(() => {
        fetchNotes();
        fetchCourses();
    }, [selectedCourse, selectedSubject, selectedType, selectedStatus, searchTerm]);

    const fetchNotes = async () => {
        try {
            const params: any = {};
            if (selectedCourse !== 'all') params.courseId = selectedCourse;
            if (selectedSubject !== 'all') params.subjectId = selectedSubject;
            if (selectedType !== 'all') params.fileType = selectedType;
            if (selectedStatus !== 'all') params.status = selectedStatus;
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

    const handleCreateNote = () => {
        navigate('/notes/create');
    };

    const handleEditNote = (note: Note) => {
        navigate(`/notes/edit/${note._id}`);
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

    const handleViewNote = (note: Note) => {
        setSelectedNote(note);
        setIsViewerOpen(true);
    };

    const handleExecuteCopyNote = async () => {
        if (!copyModalNote || targetCopyCourseIds.length === 0) return;
        try {
            setCopying(true);
            const res: any = await noteAPI.copyToCourses(copyModalNote._id, targetCopyCourseIds);
            const skipped = res?.data?.skippedCourses || [];
            if (skipped.length > 0) {
                addToast({
                    type: 'success',
                    message: `Note copied to ${res?.data?.createdCount || 0} course(s). ${skipped.length} skipped: ${skipped.map((s: any) => s.reason).join('; ')}`,
                });
            } else {
                addToast({
                    type: 'success',
                    message: `Note copied to ${res?.data?.createdCount || targetCopyCourseIds.length} course(s) successfully! 🎉`,
                });
            }
            setCopyModalNote(null);
            setTargetCopyCourseIds([]);
            fetchNotes();
        } catch (error: any) {
            addToast({
                type: 'error',
                message: error?.response?.data?.message || error?.message || 'Failed to copy note',
            });
        } finally {
            setCopying(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCourse('all');
        setSelectedSubject('all');
        setSelectedType('all');
        setSelectedStatus('all');
    };

    const activeFiltersCount =
        (searchTerm ? 1 : 0) +
        (selectedCourse !== 'all' ? 1 : 0) +
        (selectedSubject !== 'all' ? 1 : 0) +
        (selectedType !== 'all' ? 1 : 0) +
        (selectedStatus !== 'all' ? 1 : 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notes Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create and manage study materials organized by Course → Subject → Chapter
                    </p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={handleCreateNote}
                >
                    Create Note
                </Button>
            </div>

            {/* Search and Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by title, chapter, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Course Filter */}
                    <select
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedSubject('all');
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Courses</option>
                        {courses.map((course) => (
                            <option key={course._id || course.id} value={course._id || course.id}>
                                {course.title}
                            </option>
                        ))}
                    </select>

                    {/* Subject Filter */}
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={selectedCourse === 'all' || availableSubjects.length === 0}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        <option value="all">All Subjects</option>
                        {availableSubjects.map((sub: any) => (
                            <option key={sub._id} value={sub._id}>
                                {sub.icon ? `${sub.icon} ` : ''}{sub.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active / Published</option>
                        <option value="inactive">Inactive / Draft</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Types</option>
                        <option value="markdown">Markdown</option>
                        <option value="pdf">PDF</option>
                        <option value="document">Document</option>
                        <option value="text">Text</option>
                    </select>

                    {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Notes</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Online Notes</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {notes.filter(n => n.fileType === 'html').length}
                    </div>
                </Card>
            </div>

            {/* Notes Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Course
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Chapter
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {notes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No notes found</p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="mt-4"
                                            onClick={handleCreateNote}
                                            leftIcon={<Plus className="w-4 h-4" />}
                                        >
                                            Create First Note
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                notes.map((note) => (
                                    <tr key={note._id} className="">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <FileText className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {note.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                        {note.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {note.courseId?.title || 'Unknown Course'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {note.subjectName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {note.chapterName ? (
                                                <span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-xs">
                                                    {note.chapterName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={
                                                    note.fileType === 'pdf'
                                                        ? 'danger'
                                                        : note.fileType === 'html'
                                                            ? 'success'
                                                            : 'default'
                                                }
                                            >
                                                {note.fileType?.toUpperCase() || 'FILE'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={note.status === 'inactive' ? 'warning' : 'success'}>
                                                {note.status === 'inactive' ? 'Inactive' : 'Active'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewNote(note)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCopyModalNote(note);
                                                        setTargetCopyCourseIds([]);
                                                    }}
                                                    className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                                    title="Copy / Assign to Other Courses"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditNote(note)}
                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNote(note._id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Note Viewer Modal */}
            <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title={selectedNote?.title || ''} size="full">
                <div>
                    {selectedNote?.fileType === 'html' && selectedNote.markdownContent ? (
                        <div className="p-6">
                            <MarkdownViewer content={selectedNote.markdownContent} />
                        </div>
                    ) : selectedNote?.fileUrl ? (
                        <div className="flex flex-col">
                            {/* File Viewer */}
                            <div className="bg-gray-100 dark:bg-gray-900">
                                {(() => {
                                    const fileExtension = selectedNote.fileUrl.split('.').pop()?.toLowerCase();
                                    // VITE_API_URL is like https://api.letslearnandlead.com (without /api)
                                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                    const fileUrl = `${baseUrl}${selectedNote.fileUrl}`;

                                    // PDF Viewer - iframe now works with proper backend headers
                                    if (fileExtension === 'pdf') {
                                        return (
                                            <div className="p-4">
                                                <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                                                    <iframe
                                                        src={`${fileUrl}#toolbar=0`}
                                                        className="w-full h-full"
                                                        title={selectedNote.title}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Image Viewer
                                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                                        return (
                                            <div className="flex items-center justify-center p-8">
                                                <img
                                                    src={fileUrl}
                                                    alt={selectedNote.title}
                                                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
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
                                                    className="w-full h-[500px] border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                                    title={selectedNote.title}
                                                />
                                            </div>
                                        );
                                    }

                                    // Document files (DOC, DOCX) - Show download option
                                    return (
                                        <div className="flex items-center justify-center py-16">
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
                                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
                        <div className="flex items-center justify-center py-16">
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

            {/* Copy Note to Other Courses Modal */}
            {copyModalNote && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Copy Note to Other Courses
                                </h3>
                            </div>
                            <button
                                onClick={() => setCopyModalNote(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs space-y-1">
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Note Title:</span> {copyModalNote.title}</div>
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Source Course:</span> {copyModalNote.courseId?.title || 'Current Course'}</div>
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Subject:</span> {copyModalNote.subjectName}</div>
                            <p className="text-gray-600 dark:text-gray-400 pt-1">
                                Replicates this note across target courses under matching subject names. Each course maintains its own independent content record.
                            </p>
                        </div>

                        <div>
                            <MultiCourseSelector
                                courses={courses.filter(c => (c._id || c.id) !== (copyModalNote.courseId?._id || (copyModalNote.courseId as any)))}
                                selectedCourseIds={targetCopyCourseIds}
                                onChange={setTargetCopyCourseIds}
                                label="Select Target Courses"
                                helperText="Choose the courses where you want to copy/assign this note."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setCopyModalNote(null)}
                                disabled={copying}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteCopyNote}
                                disabled={copying || targetCopyCourseIds.length === 0}
                                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2"
                            >
                                {copying ? 'Copying...' : `Copy to ${targetCopyCourseIds.length} Course${targetCopyCourseIds.length === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesManagement;
