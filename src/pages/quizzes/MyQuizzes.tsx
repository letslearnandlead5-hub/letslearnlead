import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Clock, CheckCircle, PlayCircle, Trophy, AlertCircle,
    X, ChevronRight, Eye, RotateCcw, Star, Tag, Sparkles
} from 'lucide-react';
import { getAvailableQuizzes } from '../../services/quizService';
import type { QuizWithStatus, QuizAttemptSummary } from '../../types';
import toast from 'react-hot-toast';

// ── Category Badge Helper ─────────────────────────────────────────────────────
const getCategoryStyle = (categoryName?: string) => {
    if (!categoryName) return { icon: '📝', bg: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' };
    const lower = categoryName.toLowerCase();
    if (lower.includes('basic')) {
        return { icon: '📝', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    if (lower.includes('concept')) {
        return { icon: '🧠', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    }
    if (lower.includes('pyq') || lower.includes('previous')) {
        return { icon: '📑', bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800' };
    }
    if (lower.includes('general') || lower.includes('exam') || lower.includes('test')) {
        return { icon: '🏆', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    }
    if (lower.includes('speed')) {
        return { icon: '⚡', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
    return { icon: '🏷️', bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
};

// ── Attempt Picker Modal ──────────────────────────────────────────────────────
const AttemptPickerModal: React.FC<{
    quiz: QuizWithStatus;
    onClose: () => void;
    onSelectAttempt: (attemptId: string) => void;
    onRetake: () => void;
}> = ({ quiz, onClose, onSelectAttempt, onRetake }) => {
    const attempts = quiz.allAttempts || [];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                            <h3 className="text-lg font-bold leading-tight">{quiz.title}</h3>
                            <p className="text-indigo-200 text-sm mt-1">{quiz.courseName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-3 text-sm text-indigo-100">
                        {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} completed
                    </div>
                </div>

                {/* Attempts List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {attempts.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-6">No attempts found.</p>
                    ) : (
                        attempts.map((attempt, index) => (
                            <motion.button
                                key={attempt.attemptId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => onSelectAttempt(attempt.attemptId)}
                                className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md group ${
                                    index === 0
                                        ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Attempt badge */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                            attempt.isPassed
                                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                        }`}>
                                            #{attempt.attemptNumber}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    Attempt {attempt.attemptNumber}
                                                </span>
                                                {index === 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                        <Star className="w-2.5 h-2.5" /> Latest
                                                    </span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    attempt.isPassed
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                                }`}>
                                                    {attempt.isPassed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {formatDate(attempt.attemptDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right">
                                        <span className={`text-lg font-bold ${
                                            attempt.percentage >= 75 ? 'text-green-600 dark:text-green-400'
                                            : attempt.percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {Math.round(attempt.percentage)}%
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {attempt.marksObtained}/{attempt.totalMarks} marks
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Footer / Retake action */}
                {quiz.settings?.allowRetake && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {quiz.settings?.maxAttempts
                                ? `${attempts.length}/${quiz.settings.maxAttempts} attempts used`
                                : 'Unlimited retakes allowed'}
                        </span>
                        <button
                            onClick={onRetake}
                            disabled={!!(quiz.settings?.maxAttempts && attempts.length >= quiz.settings.maxAttempts)}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retake Quiz
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export const MyQuizzes: React.FC = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'not-attempted' | 'in-progress' | 'completed'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [pickerQuiz, setPickerQuiz] = useState<QuizWithStatus | null>(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getAvailableQuizzes();
            setQuizzes(data);
        } catch (error) {
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique category names from loaded quizzes
    const categoryList = Array.from(
        new Set(
            quizzes
                .map((q) => q.categoryName)
                .filter((c): c is string => Boolean(c && c.trim()))
        )
    );

    // Apply status and category filters
    const filteredQuizzes = quizzes.filter((quiz) => {
        const matchesStatus = statusFilter === 'all' || quiz.attemptStatus === statusFilter;
        const matchesCategory =
            selectedCategory === 'all'
                ? true
                : selectedCategory === 'uncategorized'
                ? !quiz.categoryName
                : quiz.categoryName === selectedCategory;
        return matchesStatus && matchesCategory;
    });

    // Group quizzes by category for default multi-section view
    const groupedByCategory = filteredQuizzes.reduce((acc, quiz) => {
        const catName = quiz.categoryName || 'General Practice';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(quiz);
        return acc;
    }, {} as Record<string, QuizWithStatus[]>);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'not-attempted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'in-progress': return <Clock className="w-4 h-4" />;
            case 'not-attempted': return <AlertCircle className="w-4 h-4" />;
            default: return <BookOpen className="w-4 h-4" />;
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in-progress': return 'In Progress';
            case 'not-attempted': return 'Not Attempted';
            default: return 'Available';
        }
    };

    const handleQuizAction = (quiz: QuizWithStatus) => {
        if (quiz.attemptStatus === 'in-progress' && quiz.inProgressAttemptId) {
            navigate(`/quizzes/${quiz._id}/attempt/?attemptId=${quiz.inProgressAttemptId}`);
        } else if (quiz.attemptStatus === 'completed') {
            setPickerQuiz(quiz);
        } else {
            navigate(`/quizzes/${quiz._id}/attempt/`);
        }
    };

    const handleSelectAttempt = (quiz: QuizWithStatus, attemptId: string) => {
        setPickerQuiz(null);
        navigate(`/quizzes/${quiz._id}/result/${attemptId}/`);
    };

    const handleRetake = (quiz: QuizWithStatus) => {
        setPickerQuiz(null);
        navigate(`/quizzes/${quiz._id}/attempt/`);
    };

    const getActionButtonText = (quiz: QuizWithStatus) => {
        if (quiz.attemptStatus === 'in-progress') return 'Resume Quiz';
        if (quiz.attemptStatus === 'completed') return 'View Results';
        return 'Start Quiz';
    };

    const renderQuizCard = (quiz: QuizWithStatus, index: number) => {
        const catStyle = getCategoryStyle(quiz.categoryName);

        return (
            <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700/60 overflow-hidden hover:shadow-xl transition-all flex flex-col group"
            >
                <div className="p-6 flex flex-col flex-1">
                    {/* Top Row: Category Chip + Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                        {quiz.categoryName ? (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${catStyle.bg}`}>
                                <span>{catStyle.icon}</span>
                                <span>{quiz.categoryName}</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                📝 General
                            </span>
                        )}

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(quiz.attemptStatus)}`}>
                            {getStatusIcon(quiz.attemptStatus)}
                            {getStatusText(quiz.attemptStatus)}
                        </span>
                    </div>

                    {/* Quiz Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {quiz.title}
                    </h3>

                    {/* Course & Subject Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 rounded-md font-semibold">
                            {quiz.courseName}
                        </span>
                        {quiz.subjectName && (
                            <span className="text-xs px-2.5 py-0.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 rounded-md font-semibold">
                                📚 {quiz.subjectName}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-xs leading-relaxed flex-1">
                            {quiz.description}
                        </p>
                    )}

                    {/* Quiz Stats Info */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl mb-4 text-xs">
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Questions</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                {quiz.totalQuestions} Questions
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Time Limit</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                {quiz.settings?.timeLimit || 30} mins
                            </span>
                        </div>
                    </div>

                    {/* Latest Score if Completed */}
                    {quiz.attemptStatus === 'completed' && quiz.lastPercentage != null && (
                        <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                            <span className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">Last Score:</span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                {Math.round(quiz.lastPercentage)}% ({quiz.lastScore} pts)
                            </span>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={() => handleQuizAction(quiz)}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                            quiz.attemptStatus === 'completed'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : quiz.attemptStatus === 'in-progress'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        <PlayCircle className="w-4 h-4" />
                        {getActionButtonText(quiz)}
                    </button>
                </div>
            </motion.div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading your quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
                            <Sparkles className="w-3.5 h-3.5" /> Practice & Assessment Hub
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                            My Quizzes & Tests
                        </h1>
                        <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                            Practice with subject-specific quiz categories (Basic, Conceptual, PYQ, and General Exams) tailored for your course.
                        </p>
                    </div>
                </div>

                {/* Dynamic Category Visual Chips Box (Per User Image Spec) */}
                {categoryList.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-8 shadow-sm">
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Quiz Categories
                        </h2>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* All Categories Chip */}
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
                                    selectedCategory === 'all'
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 dark:shadow-none'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                                }`}
                            >
                                <span>📚 All Categories</span>
                            </button>

                            {/* Category Badges */}
                            {categoryList.map((catName) => {
                                const style = getCategoryStyle(catName);
                                const isSelected = selectedCategory === catName;

                                return (
                                    <button
                                        key={catName}
                                        onClick={() => setSelectedCategory(catName)}
                                        className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm flex items-center gap-2.5 transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                : `hover:scale-105 ${style.bg}`
                                        }`}
                                    >
                                        <span className="text-base">{style.icon}</span>
                                        <span>{catName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Status Filter Tabs (Attempt Status: All, Not Attempted, In Progress, Completed) */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
                    {(['all', 'not-attempted', 'in-progress', 'completed'] as const).map((filterOption) => (
                        <button
                            key={filterOption}
                            onClick={() => setStatusFilter(filterOption)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                                statusFilter === filterOption
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            {filterOption === 'all' ? 'All Statuses' : filterOption.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            {filterOption !== 'all' && (
                                <span className="ml-1.5 opacity-70">
                                    ({quizzes.filter(q => q.attemptStatus === filterOption).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Quiz Display Section */}
                {filteredQuizzes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No Quizzes Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                            {statusFilter !== 'all' || selectedCategory !== 'all'
                                ? 'No quizzes match the selected filters.'
                                : 'Enroll in a course to access its quizzes and assessment tests.'}
                        </p>
                    </div>
                ) : selectedCategory !== 'all' ? (
                    /* Filtered Single Category View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz, idx) => renderQuizCard(quiz, idx))}
                    </div>
                ) : (
                    /* Grouped By Category View (Option C: Grouped + Filterable) */
                    <div className="space-y-10">
                        {Object.entries(groupedByCategory).map(([catName, catQuizzes]) => {
                            const catStyle = getCategoryStyle(catName);

                            return (
                                <div key={catName} className="space-y-4">
                                    {/* Section Heading */}
                                    <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
                                        <div className={`p-2 rounded-xl border text-lg ${catStyle.bg}`}>
                                            {catStyle.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                                {catName}
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                                                    {catQuizzes.length} quiz{catQuizzes.length !== 1 ? 'zes' : ''}
                                                </span>
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Grid of Quizzes in this Category */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {catQuizzes.map((quiz, idx) => renderQuizCard(quiz, idx))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Attempt History Picker Modal */}
                <AnimatePresence>
                    {pickerQuiz && (
                        <AttemptPickerModal
                            quiz={pickerQuiz}
                            onClose={() => setPickerQuiz(null)}
                            onSelectAttempt={(attemptId) => handleSelectAttempt(pickerQuiz, attemptId)}
                            onRetake={() => handleRetake(pickerQuiz)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MyQuizzes;
