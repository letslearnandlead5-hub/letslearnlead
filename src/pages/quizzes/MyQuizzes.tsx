import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Clock, CheckCircle, PlayCircle, Trophy, AlertCircle,
    X, ChevronRight, Eye, RotateCcw, Star
} from 'lucide-react';
import { getAvailableQuizzes } from '../../services/quizService';
import type { QuizWithStatus, QuizAttemptSummary } from '../../types';
import toast from 'react-hot-toast';

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
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                }`}>
                                                    {attempt.isPassed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {formatDate(attempt.attemptDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {/* Score */}
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${
                                                attempt.percentage >= 75 ? 'text-green-600 dark:text-green-400'
                                                : attempt.percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {attempt.percentage.toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {attempt.marksObtained}/{attempt.totalMarks} · {formatTime(attempt.timeTaken)}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Footer actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    {quiz.settings?.allowRetake && (
                        <button
                            onClick={onRetake}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retake Quiz
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const MyQuizzes: React.FC = () => {
    const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'not-attempted' | 'in-progress' | 'completed'>('all');
    const [pickerQuiz, setPickerQuiz] = useState<QuizWithStatus | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getAvailableQuizzes();
            setQuizzes(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const filteredQuizzes = quizzes.filter((quiz) => {
        if (filter === 'all') return true;
        return quiz.status === filter;
    });

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
        if (quiz.status === 'in-progress' && quiz.inProgressAttemptId) {
            navigate(`/quizzes/${quiz._id}/attempt/?attemptId=${quiz.inProgressAttemptId}`);
        } else if (quiz.status === 'completed') {
            // Open the attempt picker modal
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
        if (quiz.status === 'in-progress') return 'Resume Quiz';
        if (quiz.status === 'completed') return 'View Results';
        return 'Start Quiz';
    };

    const getActionButtonIcon = (quiz: QuizWithStatus) => {
        if (quiz.status === 'in-progress') return <PlayCircle className="w-4 h-4" />;
        if (quiz.status === 'completed') return <Eye className="w-4 h-4" />;
        return <PlayCircle className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Quizzes</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Test your knowledge and review your performance
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    {(['all', 'not-attempted', 'in-progress', 'completed'] as const).map((filterOption) => (
                        <button
                            key={filterOption}
                            onClick={() => setFilter(filterOption)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                filter === filterOption
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {filterOption.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            {filterOption !== 'all' && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    ({quizzes.filter(q => q.status === filterOption).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Quiz Grid */}
                {filteredQuizzes.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No quizzes found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {filter === 'all'
                                ? 'Enroll in courses to access quizzes'
                                : `No ${filter.replace('-', ' ')} quizzes available`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz, index) => (
                            <motion.div
                                key={quiz._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.07 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                            >
                                <div className="p-6 flex flex-col flex-1">
                                    {/* Status Badge + Score */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quiz.status)}`}>
                                            {getStatusIcon(quiz.status)}
                                            {getStatusText(quiz.status)}
                                        </span>
                                        {quiz.status === 'completed' && quiz.lastPercentage != null && (
                                            <span className={`text-xl font-bold ${
                                                quiz.lastPercentage >= 75 ? 'text-green-600 dark:text-green-400'
                                                : quiz.lastPercentage >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {Math.round(quiz.lastPercentage)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Quiz Title */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {quiz.title}
                                    </h3>

                                    {/* Course and Subject */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold">
                                            {quiz.courseName}
                                        </span>
                                        {quiz.subjectName && (
                                            <span className="text-xs px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-lg font-semibold">
                                                📚 {quiz.subjectName}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm flex-1">
                                        {quiz.description}
                                    </p>

                                    {/* Quiz Info */}
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>{quiz.totalQuestions} Questions · {quiz.settings?.marksPerQuestion ?? '?'} marks each</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>{quiz.settings?.timeLimit} Minutes</span>
                                        </div>
                                        {quiz.status === 'completed' && quiz.lastScore != null && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Trophy className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-500" />
                                                <span>
                                                    Best: {quiz.lastScore} / {(quiz.allAttempts?.[0]?.totalMarks ?? (quiz.totalQuestions * (quiz.settings?.marksPerQuestion ?? 1)))} marks
                                                </span>
                                            </div>
                                        )}
                                        {quiz.status === 'completed' && quiz.allAttempts && quiz.allAttempts.length > 0 && (
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                                                <span>{quiz.allAttempts.length} attempt{quiz.allAttempts.length !== 1 ? 's' : ''} completed</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleQuizAction(quiz)}
                                        className={`w-full font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                                            quiz.status === 'completed'
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {getActionButtonIcon(quiz)}
                                        {getActionButtonText(quiz)}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Attempt Picker Modal */}
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
    );
};

export default MyQuizzes;
