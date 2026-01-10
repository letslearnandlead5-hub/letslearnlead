import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    BarChart3,
    Home,
    RotateCcw,
} from 'lucide-react';
import { getQuizResult } from '../../services/quizService';
import { formatTime } from '../../services/quizService';
import type { QuizResult } from '../../types';
import toast from 'react-hot-toast';

const QuizResultView: React.FC = () => {
    const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchResult();
    }, [attemptId]);

    const fetchResult = async () => {
        if (!attemptId) return;

        try {
            setLoading(true);
            const data = await getQuizResult(attemptId);
            setResult(data.result);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load results');
            navigate('/my-quizzes');
        } finally {
            setLoading(false);
        }
    };

    const toggleExplanation = (questionId: string) => {
        const newSet = new Set(showExplanations);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        setShowExplanations(newSet);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    const getGradeColor = () => {
        if (result.percentage >= 90) return 'text-green-600';
        if (result.percentage >= 75) return 'text-blue-600';
        if (result.percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getGradeBg = () => {
        if (result.percentage >= 90) return 'bg-green-50 dark:bg-green-900/30';
        if (result.percentage >= 75) return 'bg-blue-50 dark:bg-blue-900/30';
        if (result.percentage >= 60) return 'bg-yellow-50 dark:bg-yellow-900/30';
        return 'bg-red-50 dark:bg-red-900/30';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Score Summary Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`${getGradeBg()} rounded-lg shadow-xl p-8 mb-8 text-center`}
                >
                    <div className="mb-4">
                        {result.isPassed ? (
                            <Trophy className={`w-20 h-20 ${getGradeColor()} mx-auto`} />
                        ) : (
                            <Award className="w-20 h-20 text-gray-400 mx-auto" />
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {result.isPassed ? 'Congratulations!' : 'Quiz Completed'}
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">{result.quizTitle}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className={`text-3xl font-bold ${getGradeColor()} mb-1`}>
                                {result.marksObtained}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                out of {result.totalMarks}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className={`text-3xl font-bold ${getGradeColor()} mb-1`}>
                                {result.percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Percentage</div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                                {result.correctAnswers}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-3xl font-bold text-red-600 mb-1">
                                {result.incorrectAnswers}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>Time: {formatTime(result.timeTaken)}</span>
                        </div>
                        {result.rank && (
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-600" />
                                <span>Rank: #{result.rank}</span>
                            </div>
                        )}
                    </div>

                    {result.feedback && (
                        <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">
                            {result.feedback}
                        </p>
                    )}

                    <div className="mt-6 flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/my-quizzes')}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Back to Quizzes
                        </button>
                        <button
                            onClick={() => navigate(`/quizzes/${quizId}/leaderboard`)}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <BarChart3 className="w-5 h-5" />
                            View Leaderboard
                        </button>
                    </div>
                </motion.div>

                {/* Detailed Results */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Detailed Results
                    </h2>

                    {result.questionResults.map((qResult, index) => (
                        <motion.div
                            key={qResult.questionId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${qResult.isCorrect
                                ? 'border-green-500'
                                : qResult.selectedAnswer
                                    ? 'border-red-500'
                                    : 'border-gray-400'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-gray-900 dark:text-white font-medium mb-2">
                                                {qResult.questionText}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-4">
                                        {qResult.isCorrect ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="w-6 h-6" />
                                                <span className="font-semibold">
                                                    +{qResult.marksAwarded}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-600">
                                                <XCircle className="w-6 h-6" />
                                                <span className="font-semibold">
                                                    {qResult.marksAwarded}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {qResult.selectedAnswer ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Your Answer:
                                                </span>
                                                <span
                                                    className={`font-medium ${qResult.isCorrect
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}
                                                >
                                                    {qResult.selectedAnswer}
                                                </span>
                                            </div>
                                            {!qResult.isCorrect && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Correct Answer:
                                                    </span>
                                                    <span className="font-medium text-green-600">
                                                        {qResult.correctAnswer}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400 italic">
                                            Not answered
                                        </div>
                                    )}
                                </div>

                                {qResult.explanation && (
                                    <div>
                                        <button
                                            onClick={() => toggleExplanation(qResult.questionId)}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                                        >
                                            {showExplanations.has(qResult.questionId)
                                                ? 'Hide Explanation'
                                                : 'Show Explanation'}
                                        </button>

                                        {showExplanations.has(qResult.questionId) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                                            >
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {qResult.explanation}
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizResultView;
