import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    BookOpen,
    BarChart3,
    Users,
    ShoppingCart,
    FileText,
    Settings,
    LogOut,
    MessageSquare,
    FileQuestion,
    Brain,
    X,
    Wrench,
    Archive,
    RotateCcw,
    Clock,
    PenLine,
    Save,
    Tag,
    Copy,
} from 'lucide-react';
import { getAllQuizzes, deleteQuiz, publishQuiz, repairQuizMarks, archiveQuiz, restoreQuiz, copyQuizToCourses } from '../../services/quizService';
import { courseAPI } from '../../services/api';
import { getQuizCategories } from '../../services/quizCategoryService';
import MultiCourseSelector from '../../components/admin/MultiCourseSelector';
import type { Quiz } from '../../types';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import AdminHeader from '../../components/admin/AdminHeader';

type QuizStatus = 'all' | 'published' | 'draft' | 'archived';

const STATUS_TABS: { id: QuizStatus; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'all', label: 'All', icon: FileQuestion, color: 'blue' },
    { id: 'published', label: 'Published', icon: CheckCircle, color: 'green' },
    { id: 'draft', label: 'Drafts', icon: PenLine, color: 'amber' },
    { id: 'archived', label: 'Archived', icon: Archive, color: 'gray' },
];

function timeAgo(dateStr?: string | Date | null): string {
    if (!dateStr) return '';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const QuizList: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<QuizStatus>('all');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const [courses, setCourses] = useState<any[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [repairing, setRepairing] = useState<string | null>(null);
    const [archiving, setArchiving] = useState<string | null>(null);

    // Multi-course copy state
    const [copyModalQuiz, setCopyModalQuiz] = useState<Quiz | null>(null);
    const [targetCopyCourseIds, setTargetCopyCourseIds] = useState<string[]>([]);
    const [copying, setCopying] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
        { id: 'quiz-categories', label: 'Quiz Categories', icon: Tag },
        { id: 'doubts', label: 'Student Doubts', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Brain },
    ];

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login/');
    };

    // Load Courses list on mount
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const res = await courseAPI.getAll();
                setCourses(res.data?.data || res.data || []);
            } catch (err) {
                console.error('Failed to load courses:', err);
            }
        };
        loadCourses();
    }, []);

    // Update available subjects when selectedCourse changes
    useEffect(() => {
        if (selectedCourse && selectedCourse !== 'all') {
            const courseDoc = courses.find((c) => c._id === selectedCourse);
            setAvailableSubjects(courseDoc?.subjects || []);
        } else {
            setAvailableSubjects([]);
        }
        setSelectedSubject('all');
        setSelectedCategory('all');
    }, [selectedCourse, courses]);

    // Update available categories when selectedCourse or selectedSubject changes
    useEffect(() => {
        const loadCategories = async () => {
            if (selectedCourse && selectedCourse !== 'all') {
                try {
                    const cats = await getQuizCategories(
                        selectedCourse,
                        selectedSubject !== 'all' ? selectedSubject : undefined
                    );
                    setAvailableCategories(cats);
                } catch (err) {
                    console.error('Failed to load categories:', err);
                    setAvailableCategories([]);
                }
            } else {
                setAvailableCategories([]);
            }
        };
        loadCategories();
    }, [selectedCourse, selectedSubject]);

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('You must be logged in as an admin to access this page');
            navigate('/login/');
            return;
        }
        fetchQuizzes();
    }, [filter, selectedCourse, selectedSubject, selectedCategory, user, navigate]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filter !== 'all') params.status = filter;
            if (selectedCourse !== 'all') params.courseId = selectedCourse;
            if (selectedSubject !== 'all') params.subjectId = selectedSubject;
            if (selectedCategory !== 'all') params.categoryId = selectedCategory;

            const data = await getAllQuizzes(params);
            setQuizzes(data);
        } catch (error: any) {
            console.error('Quiz fetch error:', error);
            toast.error(error?.message || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (quizId: string) => {
        try {
            await deleteQuiz(quizId);
            toast.success('Quiz deleted successfully');
            fetchQuizzes();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete quiz');
        }
    };

    const handleTogglePublish = async (quiz: Quiz) => {
        try {
            const result = await publishQuiz(quiz._id || quiz.id || '', !quiz.isPublished);
            if (result.errors?.length) {
                toast.error(`Cannot publish: ${result.errors[0]}`, { duration: 6000 });
                return;
            }
            toast.success(quiz.isPublished ? 'Quiz unpublished successfully' : 'Quiz published successfully');
            fetchQuizzes();
        } catch (error: any) {
            const errors: string[] = error?.errors;
            if (errors?.length) {
                toast.error(`Cannot publish:\n${errors.slice(0, 3).join('\n')}`, { duration: 8000 });
            } else {
                toast.error(error?.message || 'Failed to update quiz');
            }
        }
    };

    const handleRepairMarks = async (quiz: Quiz) => {
        const quizId = quiz._id || quiz.id || '';
        if (!quizId) return;
        try {
            setRepairing(quizId);
            const result = await repairQuizMarks(quizId);
            toast.success(
                result.data?.fixedCount > 0
                    ? `✅ ${result.message}`
                    : `✅ All marks already correct (${result.data?.totalQuestions} questions × ${result.data?.targetMarks} marks)`,
                { duration: 5000 }
            );
        } catch (error: any) {
            toast.error(error?.message || 'Repair failed');
        } finally {
            setRepairing(null);
        }
    };

    const handleArchive = async (quiz: Quiz) => {
        const id = quiz._id || quiz.id;
        if (!id) return;
        setArchiving(id);
        try {
            await archiveQuiz(id);
            toast.success('Quiz archived');
            fetchQuizzes();
        } catch (error: any) {
            toast.error(error.message || 'Failed to archive quiz');
        } finally {
            setArchiving(null);
        }
    };

    const handleExecuteCopy = async () => {
        if (!copyModalQuiz || targetCopyCourseIds.length === 0) return;
        const qId = copyModalQuiz._id || copyModalQuiz.id || '';
        if (!qId) return;
        try {
            setCopying(true);
            const res: any = await copyQuizToCourses(qId, targetCopyCourseIds);
            if (res?.skippedCourses?.length > 0) {
                toast.success(`Copied to ${res.createdCount} course(s). ${res.skippedCourses.length} skipped: ${res.skippedCourses.map((s: any) => s.reason).join('; ')}`, { duration: 6000 });
            } else {
                toast.success(`Quiz copied to ${res?.createdCount || targetCopyCourseIds.length} course(s) successfully! 🎉`);
            }
            setCopyModalQuiz(null);
            setTargetCopyCourseIds([]);
            fetchQuizzes();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to copy quiz');
        } finally {
            setCopying(false);
        }
    };

    const handleRestore = async (quiz: Quiz) => {
        const quizId = quiz._id || quiz.id || '';
        if (!quizId) return;
        try {
            await restoreQuiz(quizId);
            toast.success('Quiz restored to draft');
            fetchQuizzes();
        } catch (error: any) {
            toast.error(error?.message || 'Restore failed');
        }
    };

    // Status badge renderer
    const StatusBadge: React.FC<{ quiz: Quiz }> = ({ quiz }) => {
        const status = quiz.status;
        if (status === 'published') return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <CheckCircle className="w-3 h-3" /> Published
            </span>
        );
        if (status === 'archived') return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Archive className="w-3 h-3" /> Archived
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                <PenLine className="w-3 h-3" /> Draft
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
                <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />

            <div className="flex">
                <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 lg:hidden">
                        <div className="flex items-center justify-end">
                            <button onClick={() => setShowMobileSidebar(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'quizzes') {
                                        setShowMobileSidebar(false);
                                    } else if (tab.id === 'quiz-categories') {
                                        navigate('/admin/quiz-categories/');
                                        setShowMobileSidebar(false);
                                    } else {
                                        navigate(`/dashboard/?tab=${tab.id}`);
                                        setShowMobileSidebar(false);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${tab.id === 'quizzes' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <button onClick={() => { navigate('/dashboard/?tab=settings'); setShowMobileSidebar(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </nav>
                </div>

                {showMobileSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)}></div>
                )}

                <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Management</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Create and manage quizzes for your courses</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate('/admin/quiz-categories/')} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-5 py-3 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                                        <Tag className="w-5 h-5" />
                                        Quiz Categories
                                    </button>
                                    <button onClick={() => navigate('/admin/quizzes/new')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        <Plus className="w-5 h-5" />
                                        Create Quiz
                                    </button>
                                </div>
                            </div>

                            {/* Course, Subject, Category Dropdown Filters */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                        Course Filter
                                    </label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="all">All Courses</option>
                                        {courses.map((c) => (
                                            <option key={c._id} value={c._id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                        Subject Filter
                                    </label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        disabled={selectedCourse === 'all' || availableSubjects.length === 0}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="all">All Subjects</option>
                                        {availableSubjects.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.icon ? `${s.icon} ` : ''}{s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                        Quiz Category Filter
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        disabled={selectedCourse === 'all'}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="all">All Categories</option>
                                        {availableCategories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="mb-6 flex gap-2 flex-wrap">
                                {STATUS_TABS.map((tab) => {
                                    const count = tab.id === 'all'
                                        ? quizzes.length
                                        : quizzes.filter(q => q.status === tab.id).length;
                                    const isActive = filter === tab.id;
                                    const colorMap: Record<string, string> = {
                                        blue: 'bg-blue-600 text-white',
                                        green: 'bg-green-600 text-white',
                                        amber: 'bg-amber-500 text-white',
                                        gray: 'bg-gray-600 text-white',
                                    };
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFilter(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                                                isActive
                                                    ? colorMap[tab.color]
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {quizzes.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No quizzes found</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {filter === 'draft' ? 'No drafts yet. Start creating a quiz!' :
                                         filter === 'archived' ? 'No archived quizzes.' :
                                         filter === 'published' ? 'No published quizzes yet.' :
                                         'Get started by creating your first quiz'}
                                    </p>
                                    <button onClick={() => navigate('/admin/quizzes/new')} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        <Plus className="w-5 h-5" />
                                        Create Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quiz</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Saved</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {quizzes.map((quiz, index) => (
                                                    <motion.tr
                                                        key={quiz._id || quiz.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.04 }}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {quiz.title || <em className="text-gray-400">Untitled Draft</em>}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                                                    {quiz.description || <em className="text-gray-400">No description</em>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">{quiz.courseName || <span className="text-gray-400">—</span>}</div>
                                                            {quiz.subjectName && <div className="text-xs text-gray-500 dark:text-gray-400">{quiz.subjectName}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                                <BookOpen className="w-4 h-4 text-gray-400" />
                                                                <span>{quiz.totalQuestions || 0} questions</span>
                                                            </div>
                                                            {quiz.settings?.timeLimit ? (
                                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    <Clock className="w-3 h-3" />
                                                                    {quiz.settings.timeLimit} min
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <StatusBadge quiz={quiz} />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {quiz.draftMeta?.lastAutosavedAt ? (
                                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    <Save className="w-3 h-3" />
                                                                    {timeAgo(quiz.draftMeta.lastAutosavedAt)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">{timeAgo((quiz.updatedAt as any) || (quiz.createdAt as any))}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {/* Results — only for published */}
                                                                {quiz.status === 'published' && (
                                                                    <button
                                                                        onClick={() => navigate(`/admin/quizzes/${quiz._id || quiz.id}/results`)}
                                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                                                        title="View Results"
                                                                    >
                                                                        <BarChart3 className="w-5 h-5" />
                                                                    </button>
                                                                )}

                                                                {/* Edit / Continue */}
                                                                {quiz.status !== 'archived' && (
                                                                    <button
                                                                        onClick={() => navigate(`/admin/quizzes/edit/${quiz._id || quiz.id}`)}
                                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                                                        title={quiz.status === 'draft' ? 'Continue Editing' : 'Edit'}
                                                                    >
                                                                        <Edit className="w-5 h-5" />
                                                                    </button>
                                                                )}

                                                                {/* Copy to Other Courses */}
                                                                <button
                                                                    onClick={() => {
                                                                        setCopyModalQuiz(quiz);
                                                                        setTargetCopyCourseIds([]);
                                                                    }}
                                                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                                                                    title="Copy to Other Courses"
                                                                >
                                                                    <Copy className="w-5 h-5" />
                                                                </button>

                                                                {/* Repair marks */}
                                                                {quiz.status !== 'archived' && (
                                                                    <button
                                                                        onClick={() => handleRepairMarks(quiz)}
                                                                        disabled={repairing === (quiz._id || quiz.id)}
                                                                        title="Repair Marks"
                                                                        className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 disabled:opacity-40 disabled:cursor-wait"
                                                                    >
                                                                        <Wrench className={`w-5 h-5 ${repairing === (quiz._id || quiz.id) ? 'animate-spin' : ''}`} />
                                                                    </button>
                                                                )}

                                                                {/* Publish / Unpublish — only for non-archived */}
                                                                {quiz.status !== 'archived' && (
                                                                    <button
                                                                        onClick={() => handleTogglePublish(quiz)}
                                                                        className={`${quiz.isPublished ? 'text-orange-600 dark:text-orange-400 hover:text-orange-900' : 'text-green-600 dark:text-green-400 hover:text-green-900'}`}
                                                                        title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                                                                    >
                                                                        {quiz.isPublished ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                                    </button>
                                                                )}

                                                                {/* Archive — only for draft/published */}
                                                                {quiz.status !== 'archived' && (
                                                                    <button
                                                                        onClick={() => handleArchive(quiz)}
                                                                        disabled={archiving === (quiz._id || quiz.id)}
                                                                        title="Archive"
                                                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                                                    >
                                                                        <Archive className="w-5 h-5" />
                                                                    </button>
                                                                )}

                                                                {/* Restore — only for archived */}
                                                                {quiz.status === 'archived' && (
                                                                    <button
                                                                        onClick={() => handleRestore(quiz)}
                                                                        title="Restore to Draft"
                                                                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
                                                                    >
                                                                        <RotateCcw className="w-5 h-5" />
                                                                    </button>
                                                                )}

                                                                {/* Delete */}
                                                                <button
                                                                    onClick={() => setDeleteConfirm(quiz._id || quiz.id || '')}
                                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Quiz</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Are you sure you want to delete this quiz? This action will permanently remove the quiz and cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy to Other Courses Modal */}
            {copyModalQuiz && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Copy Quiz to Other Courses
                                </h3>
                            </div>
                            <button
                                onClick={() => setCopyModalQuiz(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs space-y-1">
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Quiz Title:</span> {copyModalQuiz.title}</div>
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Source Course:</span> {copyModalQuiz.courseName}</div>
                            <div><span className="font-semibold text-purple-900 dark:text-purple-200">Subject:</span> {copyModalQuiz.subjectName}</div>
                            <p className="text-gray-600 dark:text-gray-400 pt-1">
                                Copies the full quiz content & questions to the selected target courses. Each course maintains its own independent attempt and score records.
                            </p>
                        </div>

                        <div>
                            <MultiCourseSelector
                                courses={courses.filter(c => (c._id || c.id) !== copyModalQuiz.courseId)}
                                selectedCourseIds={targetCopyCourseIds}
                                onChange={setTargetCopyCourseIds}
                                label="Select Target Courses"
                                helperText="Choose the courses where you want to copy/assign this quiz."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setCopyModalQuiz(null)}
                                disabled={copying}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteCopy}
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

export default QuizList;
