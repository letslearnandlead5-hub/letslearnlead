import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, PlayCircle, Trophy, AlertCircle } from 'lucide-react';
import { getAvailableQuizzes } from '../../services/quizService';
import type { QuizWithStatus } from '../../types';
import toast from 'react-hot-toast';

const MyQuizzes: React.FC = () => {
    const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'not-attempted' | 'in-progress' | 'completed'>('all');
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
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in-progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'not-attempted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5" />;
            case 'in-progress':
                return <Clock className="w-5 h-5" />;
            case 'not-attempted':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <BookOpen className="w-5 h-5" />;
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'in-progress':
                return 'In Progress';
            case 'not-attempted':
                return 'Not Attempted';
            default:
                return 'Available';
        }
    };

    const handleQuizAction = (quiz: QuizWithStatus) => {
        if (quiz.status === 'in-progress' && quiz.inProgressAttemptId) {
            navigate(`/quizzes/${quiz._id}/attempt?attemptId=${quiz.inProgressAttemptId}`);
        } else if (quiz.status === 'completed') {
            navigate(`/quizzes/${quiz._id}/leaderboard`);
        } else {
            navigate(`/quizzes/${quiz._id}/attempt`);
        }
    };

    const getActionButtonText = (quiz: QuizWithStatus) => {
        if (quiz.status === 'in-progress') return 'Resume Quiz';
        if (quiz.status === 'completed' && quiz.settings.allowRetake) return 'Retake Quiz';
        if (quiz.status === 'completed') return 'View Leaderboard';
        return 'Start Quiz';
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
                        Test your knowledge and compete with other students
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    {['all', 'not-attempted', 'in-progress', 'completed'].map((filterOption) => (
                        <button
                            key={filterOption}
                            onClick={() => setFilter(filterOption as any)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filter === filterOption
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {filterOption.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                                quiz.status
                                            )}`}
                                        >
                                            {getStatusIcon(quiz.status)}
                                            {getStatusText(quiz.status)}
                                        </span>
                                        {quiz.status === 'completed' && quiz.lastPercentage !== undefined && (
                                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {Math.round(quiz.lastPercentage)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Quiz Title */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {quiz.title}
                                    </h3>

                                    {/* Course Name */}
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3">
                                        {quiz.courseName}
                                    </p>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {quiz.description}
                                    </p>

                                    {/* Quiz Info */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            <span>{quiz.totalQuestions} Questions</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <span>{quiz.settings.timeLimit} Minutes</span>
                                        </div>
                                        {quiz.status === 'completed' && quiz.lastScore !== undefined && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Trophy className="w-4 h-4 mr-2" />
                                                <span>Score: {quiz.lastScore} marks</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleQuizAction(quiz)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        {getActionButtonText(quiz)}
                                    </button>

                                    {quiz.attemptCount && quiz.attemptCount > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                            Attempts: {quiz.attemptCount}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyQuizzes;
