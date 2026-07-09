import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookmarkPlus,
    BookOpen,
    Eye,
    FileText,
    Filter,
    FolderOpen,
    Layers,
    Search,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { noteAPI, userNoteAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface EnrolledSubject {
    enrollmentId: string;
    subjectId: string;
    subjectName: string;
    subjectIcon: string;
    courseId: string;
    courseTitle: string;
}

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: 'html' | 'pdf' | 'text' | 'file';
    tags?: string[];
    category?: string;
    subjectId?: string;
    subjectName?: string;
    courseId: { _id: string; title: string };
    createdAt: string;
}

const SubjectNotes: React.FC = () => {
    const [subjects, setSubjects] = useState<EnrolledSubject[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedSubjectId, setSelectedSubjectId] = useState('all');
    const { token } = useAuthStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const subjectIdFromUrl = searchParams.get('subjectId') || 'all';
        setSelectedSubjectId(subjectIdFromUrl);
    }, [searchParams]);

    useEffect(() => {
        fetchPurchasedSubjects();
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [selectedSubjectId, selectedType, searchTerm]);

    const selectedSubject = useMemo(
        () => subjects.find((subject) => subject.subjectId === selectedSubjectId),
        [subjects, selectedSubjectId]
    );

    const fetchPurchasedSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/enrollment/my-enrollments`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch your subjects');
            const data = await res.json();
            const enrollments: any[] = data.data || [];

            const purchasedSubjects = enrollments
                .filter((enrollment: any) => enrollment.courseId && enrollment.subjectId)
                .map((enrollment: any) => {
                    const course = enrollment.courseId;
                    const subjectData = course.subjects?.find(
                        (subject: any) => subject._id?.toString() === enrollment.subjectId?.toString()
                    );

                    return {
                        enrollmentId: enrollment._id || `${course._id}-${enrollment.subjectId}`,
                        subjectId: enrollment.subjectId,
                        subjectName: enrollment.subjectName || subjectData?.name || 'Unknown Subject',
                        subjectIcon: subjectData?.icon || 'Book',
                        courseId: course._id,
                        courseTitle: course.title || 'Unknown Course',
                    } as EnrolledSubject;
                });

            setSubjects(purchasedSubjects);
        } catch (error: any) {
            console.error('Error fetching purchased subjects:', error);
            addToast({ type: 'error', message: error.message || 'Failed to load your subjects' });
            setSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchNotes = async () => {
        try {
            setLoadingNotes(true);
            const params: any = {};
            if (selectedSubjectId !== 'all') params.subjectId = selectedSubjectId;
            if (selectedType !== 'all') params.fileType = selectedType;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const response: any = await noteAPI.getAll(params);
            setNotes(response.data || []);
        } catch (error: any) {
            console.error('Error fetching subject notes:', error);
            addToast({ type: 'error', message: error.message || 'Failed to load subject notes' });
            setNotes([]);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'subject-notes');
        if (subjectId === 'all') {
            nextParams.delete('subjectId');
        } else {
            nextParams.set('subjectId', subjectId);
        }
        navigate(`/dashboard/?${nextParams.toString()}`);
    };

    const handleSaveNote = async (noteId: string) => {
        try {
            await userNoteAPI.save(noteId);
            addToast({ type: 'success', message: 'Saved to your notes library' });
        } catch (error: any) {
            console.error('Error saving note:', error);
            addToast({ type: 'error', message: error.message || 'Failed to save note' });
        }
    };

    const getEmptyTitle = () => {
        if (searchTerm || selectedType !== 'all') return 'No notes match your filters';
        if (selectedSubject) return `No notes uploaded for ${selectedSubject.subjectName} yet`;
        return subjects.length === 0 ? 'No purchased subjects yet' : 'No notes available yet';
    };

    const getEmptyMessage = () => {
        if (searchTerm || selectedType !== 'all') return 'Try changing the search or file type filter.';
        if (selectedSubject) return 'When the admin uploads notes for this subject, they will appear here.';
        return subjects.length === 0
            ? 'Purchase a subject first, then its notes will appear here.'
            : 'Your purchased-subject notes will appear here when they are uploaded.';
    };

    const totalSubjectsWithNotes = new Set(notes.map((note) => note.subjectId).filter(Boolean)).size;

    if (loadingSubjects) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Subject Notes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Notes from only your purchased subjects
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-violet-600 bg-violet-100 dark:bg-violet-900/40">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Purchased Subjects</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</div>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-blue-600 bg-blue-100 dark:bg-blue-900/40">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Visible Notes</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</div>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Subjects With Notes</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSubjectsWithNotes}</div>
                        </div>
                    </Card>
                </div>

                <Card className="p-4 mb-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleSubjectChange('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    selectedSubjectId === 'all'
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                All Purchased
                            </button>
                            {subjects.map((subject) => (
                                <button
                                    key={subject.enrollmentId}
                                    onClick={() => handleSubjectChange(subject.subjectId)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                        selectedSubjectId === subject.subjectId
                                            ? 'bg-violet-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="mr-2">{subject.subjectIcon}</span>
                                    {subject.subjectName}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search notes by title, subject, or tag..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                                />
                            </div>
                            <div className="relative md:w-56">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={selectedType}
                                    onChange={(event) => setSelectedType(event.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                                >
                                    <option value="all">All Types</option>
                                    <option value="html">Online Notes</option>
                                    <option value="file">Files</option>
                                    <option value="pdf">PDF</option>
                                    <option value="text">Text</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {loadingNotes ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                    </div>
                ) : notes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {getEmptyTitle()}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{getEmptyMessage()}</p>
                    </Card>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {notes.map((note) => (
                            <motion.div key={note._id} variants={staggerItem}>
                                <Card className="h-full flex flex-col p-6 hover:shadow-xl transition-shadow">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600">
                                            {note.fileType === 'html' ? (
                                                <FileText className="w-6 h-6" />
                                            ) : (
                                                <FolderOpen className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                                                {note.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                {note.courseId?.title || 'Course'}
                                            </p>
                                            {note.subjectName && (
                                                <Badge variant="primary" className="mt-2">
                                                    {note.subjectName}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-1 mb-4">
                                        {note.description || 'No description available'}
                                    </p>

                                    <div className="flex items-center gap-2 flex-wrap mb-4">
                                        <Badge variant={note.fileType === 'pdf' ? 'danger' : 'secondary'}>
                                            {note.fileType.toUpperCase()}
                                        </Badge>
                                        {note.category && <Badge variant="secondary">{note.category}</Badge>}
                                        {note.tags?.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="flex-1"
                                            leftIcon={<Eye className="w-4 h-4" />}
                                            onClick={() => navigate(`/notes/view/${note._id}/`)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<BookmarkPlus className="w-4 h-4" />}
                                            onClick={() => handleSaveNote(note._id)}
                                        >
                                            Save
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

export default SubjectNotes;
