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
    GraduationCap,
    Layers,
    Search,
    Tag,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { noteAPI, userNoteAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface EnrolledCourse {
    courseId: string;
    courseTitle: string;
    subjects: Array<{
        subjectId: string;
        subjectName: string;
        subjectIcon: string;
    }>;
}

interface Note {
    _id: string;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: 'html' | 'pdf' | 'text' | 'file';
    tags?: string[];
    chapterName?: string;
    chapterId?: string;
    subjectId?: string;
    subjectName?: string;
    courseId: { _id: string; title: string };
    createdAt: string;
}

const SubjectNotes: React.FC = () => {
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const { token } = useAuthStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Fetch student enrollments on mount
    useEffect(() => {
        fetchMyEnrollments();
    }, []);

    const fetchMyEnrollments = async () => {
        try {
            setLoadingCourses(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/enrollment/my-enrollments`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch your enrollments');
            const data = await res.json();
            const enrollments: any[] = data.data || [];

            // Process enrolled courses and unpack subjects
            const coursesList: EnrolledCourse[] = [];
            const seenCourseIds = new Set<string>();

            enrollments.forEach((enrollment: any) => {
                const course = enrollment.courseId;
                if (!course) return;
                const cId = (course._id || course.id || '').toString();
                if (!cId || seenCourseIds.has(cId)) return;
                seenCourseIds.add(cId);

                const subjects = (course.subjects || []).map((s: any) => ({
                    subjectId: (s._id || s.id || '').toString(),
                    subjectName: s.name || 'Subject',
                    subjectIcon: s.icon || '📚',
                }));

                coursesList.push({
                    courseId: cId,
                    courseTitle: course.title || 'Untitled Course',
                    subjects,
                });
            });

            setEnrolledCourses(coursesList);

            // Auto-select course from URL param or first available course
            const urlCourseId = searchParams.get('courseId');
            if (urlCourseId && coursesList.some(c => c.courseId === urlCourseId)) {
                setSelectedCourseId(urlCourseId);
            } else if (coursesList.length > 0) {
                setSelectedCourseId(coursesList[0].courseId);
            }

            const urlSubjectId = searchParams.get('subjectId');
            if (urlSubjectId) {
                setSelectedSubjectId(urlSubjectId);
            }
        } catch (error: any) {
            console.error('Error fetching enrolled courses:', error);
            addToast({ type: 'error', message: error.message || 'Failed to load enrolled courses' });
            setEnrolledCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    // Active course object
    const currentCourse = useMemo(() => {
        return enrolledCourses.find(c => c.courseId === selectedCourseId) || null;
    }, [enrolledCourses, selectedCourseId]);

    // Available subjects for the active course
    const availableSubjects = useMemo(() => {
        return currentCourse?.subjects || [];
    }, [currentCourse]);

    // Fetch notes whenever course, subject, type, or search changes
    useEffect(() => {
        if (!selectedCourseId) return;
        fetchNotes();
    }, [selectedCourseId, selectedSubjectId, selectedType, searchTerm]);

    const fetchNotes = async () => {
        try {
            setLoadingNotes(true);
            const params: any = { courseId: selectedCourseId };
            if (selectedSubjectId !== 'all') params.subjectId = selectedSubjectId;
            if (selectedType !== 'all') params.fileType = selectedType;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const response: any = await noteAPI.getAll(params);
            setNotes(response.data || []);
        } catch (error: any) {
            console.error('Error fetching notes:', error);
            addToast({ type: 'error', message: error.message || 'Failed to load study notes' });
            setNotes([]);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleCourseChange = (courseId: string) => {
        setSelectedCourseId(courseId);
        setSelectedSubjectId('all');
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'subject-notes');
        nextParams.set('courseId', courseId);
        nextParams.delete('subjectId');
        navigate(`/dashboard/?${nextParams.toString()}`);
    };

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'subject-notes');
        if (selectedCourseId) nextParams.set('courseId', selectedCourseId);
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
            addToast({ type: 'success', message: 'Note saved to your library! 🔖' });
        } catch (error: any) {
            console.error('Error saving note:', error);
            addToast({ type: 'error', message: error?.response?.data?.message || error.message || 'Failed to save note' });
        }
    };

    // Group notes by Chapter
    const notesByChapter = useMemo(() => {
        const groups: Record<string, Note[]> = {};
        notes.forEach((note) => {
            const chap = note.chapterName?.trim() || 'General Study Material';
            if (!groups[chap]) groups[chap] = [];
            groups[chap].push(note);
        });
        return groups;
    }, [notes]);

    const totalSubjectsCount = useMemo(() => {
        return enrolledCourses.reduce((acc, c) => acc + c.subjects.length, 0);
    }, [enrolledCourses]);

    if (loadingCourses) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (enrolledCourses.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
                <div className="container mx-auto px-4 max-w-5xl">
                    <Card className="p-12 text-center">
                        <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            No Enrolled Courses Found
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                            You are not currently enrolled in any courses. Explore our courses and enroll to access study notes and chapter materials.
                        </p>
                        <Button variant="primary" onClick={() => navigate('/courses/')}>
                            Explore Courses
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        My Study Notes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Course & Subject study materials organized chapter-wise
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-primary-600 bg-primary-100 dark:bg-primary-900/40">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Enrolled Courses</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{enrolledCourses.length}</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-violet-600 bg-violet-100 dark:bg-violet-900/40">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Available Subjects</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{availableSubjects.length}</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4">
                        <div className="p-2.5 rounded-xl text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Study Notes</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</div>
                        </div>
                    </Card>
                </div>

                {/* Step 1: Course Selection Tabs (When student has multiple courses) */}
                {enrolledCourses.length > 1 && (
                    <div className="mb-6">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Select Course
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {enrolledCourses.map((c) => (
                                <button
                                    key={c.courseId}
                                    onClick={() => handleCourseChange(c.courseId)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        selectedCourseId === c.courseId
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                >
                                    🎓 {c.courseTitle}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Subject Filter Pills & Search */}
                <Card className="p-5 mb-8">
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Subjects in {currentCourse?.courseTitle || 'Selected Course'}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleSubjectChange('all')}
                                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        selectedSubjectId === 'all'
                                            ? 'bg-violet-600 text-white shadow'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    All Subjects ({notes.length})
                                </button>
                                {availableSubjects.map((sub) => (
                                    <button
                                        key={sub.subjectId}
                                        onClick={() => handleSubjectChange(sub.subjectId)}
                                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                            selectedSubjectId === sub.subjectId
                                                ? 'bg-violet-600 text-white shadow'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <span>{sub.subjectIcon}</span>
                                        <span>{sub.subjectName}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search and Format Filter */}
                        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search notes by title or chapter..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>
                            <div className="relative md:w-52">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                    <option value="all">All Formats</option>
                                    <option value="html">Online Notes</option>
                                    <option value="pdf">PDF Documents</option>
                                    <option value="doc">Word Documents</option>
                                    <option value="txt">Text Notes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Step 3: Chapter-Grouped Notes Display */}
                {loadingNotes ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                    </div>
                ) : notes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No Notes Available Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            {searchTerm || selectedType !== 'all'
                                ? 'No notes match your current search or format filter.'
                                : `When study materials are uploaded for ${currentCourse?.courseTitle || 'this course'}, they will appear here.`}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(notesByChapter).map(([chapterTitle, chapterNotes]) => (
                            <div key={chapterTitle} className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                                    <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {chapterTitle}
                                    </h2>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                                        {chapterNotes.length} {chapterNotes.length === 1 ? 'Note' : 'Notes'}
                                    </span>
                                </div>

                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
                                >
                                    {chapterNotes.map((note) => (
                                        <motion.div key={note._id} variants={staggerItem}>
                                            <Card className="h-full flex flex-col p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
                                                {/* Header with Icon & Subject */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex-shrink-0">
                                                        {note.fileType === 'html' ? (
                                                            <FileText className="w-5 h-5" />
                                                        ) : (
                                                            <FolderOpen className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
                                                            {note.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {note.subjectName && (
                                                                <span className="inline-flex items-center text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded">
                                                                    📚 {note.subjectName}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400 uppercase">
                                                                {note.fileType?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 flex-1 mb-4">
                                                    {note.description || 'Comprehensive study note for this topic.'}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="flex-1 text-xs"
                                                        leftIcon={<Eye className="w-4 h-4" />}
                                                        onClick={() => navigate(`/notes/view/${note._id}/`)}
                                                    >
                                                        View Note
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectNotes;
