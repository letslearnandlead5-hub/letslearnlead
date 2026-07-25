import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    BarChart3,
    Home,
    ChevronDown,
    ChevronUp,
    Minus,
    BookOpen,
    ChevronLeft,
} from 'lucide-react';
import { getQuizResult } from '../../services/quizService';
import { formatTime } from '../../services/quizService';
import type { QuizResult } from '../../types';
import toast from 'react-hot-toast';
import RichTextDisplay from '../../components/quiz/RichTextDisplay';

const QuizResultView: React.FC = () => {
    const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
    const navigate = useNavigate();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set());
    const [expandAll, setExpandAll] = useState(false);
    const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

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
            navigate('/my-quizzes/');
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

    const handleExpandAll = () => {
        if (!result) return;
        if (expandAll) {
            setShowExplanations(new Set());
        } else {
            setShowExplanations(new Set(result.questionResults.map(q => q.questionId)));
        }
        setExpandAll(!expandAll);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!result) return null;

    const getGradeColor = () => {
        if (result.percentage >= 90) return 'text-green-600 dark:text-green-400';
        if (result.percentage >= 75) return 'text-blue-600 dark:text-blue-400';
        if (result.percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getGradeBg = () => {
        if (result.percentage >= 90) return 'from-green-500 to-emerald-600';
        if (result.percentage >= 75) return 'from-blue-500 to-indigo-600';
        if (result.percentage >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-rose-600';
    };

    const getGrade = () => {
        if (result.percentage >= 90) return 'A+';
        if (result.percentage >= 80) return 'A';
        if (result.percentage >= 70) return 'B';
        if (result.percentage >= 60) return 'C';
        if (result.percentage >= 50) return 'D';
        return 'F';
    };

    // Filter question results
    const filteredResults = result.questionResults.filter(qr => {
        if (filterMode === 'all') return true;
        if (filterMode === 'correct') return qr.isCorrect;
        if (filterMode === 'incorrect') return !qr.isCorrect && !!qr.selectedAnswer;
        if (filterMode === 'skipped') return !qr.selectedAnswer;
        return true;
    });

    const filterCounts = {
        all: result.questionResults.length,
        correct: result.correctAnswers,
        incorrect: result.incorrectAnswers,
        skipped: result.unansweredQuestions,
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back button */}
                <button
                    onClick={() => navigate('/my-quizzes/')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium">Back to My Quizzes</span>
                </button>

                {/* ── Score Summary Card ─────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl shadow-xl overflow-hidden mb-8"
                >
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-br ${getGradeBg()} p-8 text-white text-center`}>
                        <div className="mb-3">
                            {result.isPassed ? (
                                <Trophy className="w-16 h-16 mx-auto opacity-90" />
                            ) : (
                                <Award className="w-16 h-16 mx-auto opacity-80" />
                            )}
                        </div>
                        <h1 className="text-3xl font-bold mb-1">
                            {result.isPassed ? 'Congratulations!' : 'Quiz Completed'}
                        </h1>
                        <p className="opacity-80 text-sm mb-4">{result.quizTitle}</p>

                        {/* Big score */}
                        <div className="flex items-end justify-center gap-2 mb-1">
                            <span className="text-6xl font-black">{result.marksObtained}</span>
                            <span className="text-2xl opacity-70 mb-2">/ {result.totalMarks}</span>
                        </div>
                        <div className="text-4xl font-bold opacity-95 mb-1">
                            {result.percentage.toFixed(1)}%
                        </div>
                        <div className="text-lg opacity-80">
                            Grade: <span className="font-bold">{getGrade()}</span>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="bg-white dark:bg-gray-800 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700">
                        <div className="p-5 text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {result.correctAnswers}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Correct</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {result.incorrectAnswers}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Incorrect</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                                {result.unansweredQuestions}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Skipped</div>
                        </div>
                        <div className="p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-gray-700 dark:text-gray-300">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                {formatTime(result.timeTaken)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Time Taken</div>
                        </div>
                    </div>

                    {/* Rank + Status */}
                    <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            {result.rank && (
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1.5 rounded-lg">
                                    <Trophy className="w-4 h-4" />
                                    Rank #{result.rank}
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg ${
                                result.isPassed
                                    ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30'
                                    : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30'
                            }`}>
                                {result.isPassed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {result.isPassed ? 'Passed' : 'Not Passed'}
                            </span>
                        </div>
                        {result.feedback && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                "{result.feedback}"
                            </p>
                        )}
                        {/* Action buttons */}
                        <div className="flex gap-3 ml-auto">
                            <button
                                onClick={() => navigate(`/quizzes/${quizId}/leaderboard/`)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                Leaderboard
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Detailed Results Section ──────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Question Review
                            </h2>
                        </div>
                        <button
                            onClick={handleExpandAll}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                        >
                            {expandAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expandAll ? 'Collapse All' : 'Expand All'} Explanations
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                        {(['all', 'correct', 'incorrect', 'skipped'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                    filterMode === mode
                                        ? mode === 'correct' ? 'bg-green-600 text-white'
                                        : mode === 'incorrect' ? 'bg-red-600 text-white'
                                        : mode === 'skipped' ? 'bg-gray-500 text-white'
                                        : 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {mode === 'correct' && <CheckCircle className="w-3.5 h-3.5" />}
                                {mode === 'incorrect' && <XCircle className="w-3.5 h-3.5" />}
                                {mode === 'skipped' && <Minus className="w-3.5 h-3.5" />}
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                <span className="opacity-70">({filterCounts[mode]})</span>
                            </button>
                        ))}
                    </div>

                    {filteredResults.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No questions in this category.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredResults.map((qResult, index) => {
                                const globalIndex = result.questionResults.indexOf(qResult);
                                const isExpanded = showExplanations.has(qResult.questionId);

                                return (
                                    <motion.div
                                        key={qResult.questionId}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-l-4 ${
                                            qResult.isCorrect
                                                ? 'border-green-500'
                                                : qResult.selectedAnswer
                                                    ? 'border-red-500'
                                                    : 'border-gray-400 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="p-6">
                                            {/* Question header */}
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    {/* Q number badge */}
                                                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        qResult.isCorrect
                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                            : qResult.selectedAnswer
                                                                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {globalIndex + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-gray-900 dark:text-white font-medium">
                                                            <RichTextDisplay content={qResult.questionText} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Marks badge */}
                                                <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                                                    qResult.isCorrect
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                        : qResult.selectedAnswer
                                                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {qResult.isCorrect ? (
                                                        <><CheckCircle className="w-4 h-4" /> +{qResult.marksAwarded}</>
                                                    ) : qResult.selectedAnswer ? (
                                                        <><XCircle className="w-4 h-4" /> {qResult.marksAwarded}</>
                                                    ) : (
                                                        <><Minus className="w-4 h-4" /> 0</>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Answer section */}
                                            <div className="ml-11 space-y-2 mb-4">
                                                {qResult.selectedAnswer ? (
                                                    <>
                                                        <div className="flex items-start gap-2 flex-wrap">
                                                            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Your Answer:</span>
                                                            <span className={`text-sm font-semibold ${
                                                                qResult.isCorrect
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {qResult.selectedAnswer}
                                                            </span>
                                                        </div>
                                                        {!qResult.isCorrect && qResult.correctAnswer !== 'match' && (
                                                            <div className="flex items-start gap-2 flex-wrap">
                                                                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Correct Answer:</span>
                                                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                                    {qResult.correctAnswer}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">Not answered</span>
                                                        {qResult.correctAnswer && qResult.correctAnswer !== 'match' && (
                                                            <>
                                                                <span className="text-gray-400">·</span>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">Correct:</span>
                                                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                                    {qResult.correctAnswer}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Explanation toggle */}
                                            {qResult.explanation && (
                                                <div className="ml-11">
                                                    <button
                                                        onClick={() => toggleExplanation(qResult.questionId)}
                                                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                                                    >
                                                        {isExpanded
                                                            ? <><ChevronUp className="w-4 h-4" /> Hide Explanation</>
                                                            : <><ChevronDown className="w-4 h-4" /> Show Explanation</>
                                                        }
                                                    </button>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800"
                                                            >
                                                                <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center gap-1.5">
                                                                    <BookOpen className="w-4 h-4" /> Explanation
                                                                </div>
                                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                                    <RichTextDisplay content={qResult.explanation} />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom navigation */}
                    <div className="mt-8 flex gap-4 justify-center flex-wrap">
                        <button
                            onClick={() => navigate('/my-quizzes/')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Back to Quizzes
                        </button>
                        <button
                            onClick={() => navigate(`/quizzes/${quizId}/leaderboard/`)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <BarChart3 className="w-5 h-5" />
                            View Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizResultView;
