import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Send,
    AlertCircle,
    BookOpen,
    CheckCircle,
} from 'lucide-react';
import QuizTimer from '../../components/quiz/QuizTimer';
import QuestionDisplay from '../../components/quiz/QuestionDisplay';
import { useQuizStore } from '../../store/useQuizStore';
import {
    getQuizPreview,
    startQuizAttempt,
    saveQuizAnswer,
    submitQuiz,
} from '../../services/quizService';
import toast from 'react-hot-toast';

const QuizAttempt: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const {
        currentQuiz,
        attemptId,
        answers,
        timeRemaining,
        isTimerRunning,
        currentQuestionIndex,
        setQuiz,
        setAnswer,
        getAnswer,
        setTimeRemaining,
        startTimer,
        stopTimer,
        decrementTime,
        setCurrentQuestionIndex,
        resetQuiz,
    } = useQuizStore();

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [quizPreview, setQuizPreview] = useState<any>(null);

    // Load quiz preview or resume attempt
    useEffect(() => {
        const loadQuiz = async () => {
            if (!quizId) return;

            try {
                setLoading(true);
                const existingAttemptId = searchParams.get('attemptId');

                if (existingAttemptId) {
                    // Resume existing attempt
                    const preview = await getQuizPreview(quizId);
                    setQuizPreview(preview);

                    // Start the quiz with existing attempt
                    const response = await startQuizAttempt(quizId);
                    setQuiz(response.quiz, response.attemptId);
                    setHasStarted(true);
                    startTimer();
                } else {
                    // Load preview for new attempt
                    const preview = await getQuizPreview(quizId);
                    setQuizPreview(preview);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load quiz');
                navigate('/my-quizzes');
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [quizId, searchParams]);

    // Timer countdown
    useEffect(() => {
        if (!isTimerRunning || timeRemaining === null) return;

        const interval = setInterval(() => {
            decrementTime();
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning, timeRemaining, decrementTime]);

    // Auto-save answer
    const handleAnswerSelect = useCallback(
        async (questionId: string, answer: string) => {
            if (!attemptId) return;

            setAnswer(questionId, answer);

            try {
                await saveQuizAnswer(attemptId, questionId, answer);
            } catch (error: any) {
                toast.error('Failed to save answer');
            }
        },
        [attemptId, setAnswer]
    );

    // Handle time up
    const handleTimeUp = useCallback(async () => {
        stopTimer();
        toast.error('Time is up! Submitting quiz...');
        await handleSubmitQuiz(true);
    }, [stopTimer]);

    // Start quiz
    const handleStartQuiz = async () => {
        if (!quizId) return;

        try {
            setStarting(true);
            const response = await startQuizAttempt(quizId);
            setQuiz(response.quiz, response.attemptId);
            setHasStarted(true);
            startTimer();
            toast.success('Quiz started! Good luck!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to start quiz');
        } finally {
            setStarting(false);
        }
    };

    // Submit quiz
    const handleSubmitQuiz = async (autoSubmit = false) => {
        if (!attemptId) return;

        try {
            setSubmitting(true);
            stopTimer();

            const response = await submitQuiz(attemptId);

            toast.success('Quiz submitted successfully!');
            resetQuiz();

            navigate(`/quizzes/${quizId}/result/${attemptId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit quiz');
            if (!autoSubmit) startTimer();
        } finally {
            setSubmitting(false);
            setShowSubmitConfirm(false);
        }
    };

    // Navigation
    const handlePrevious = () => {
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    };

    const handleNext = () => {
        if (currentQuiz) {
            setCurrentQuestionIndex(Math.min(currentQuiz.questions.length - 1, currentQuestionIndex + 1));
        }
    };

    const jumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Pre-start screen
    if (!hasStarted && quizPreview) {
        const quiz = quizPreview.quiz;
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8"
                    >
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {quiz.title}
                        </h1>
                        <p className="text-indigo-600 dark:text-indigo-400 mb-6">{quiz.courseName}</p>

                        <p className="text-gray-600 dark:text-gray-400 mb-8">{quiz.description}</p>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Quiz Rules
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        <strong>{quiz.totalQuestions}</strong> questions
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        <strong>{quiz.settings.marksPerQuestion}</strong> marks per question
                                    </span>
                                </div>
                                {quiz.settings.negativeMarking > 0 && (
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            <strong>-{quiz.settings.negativeMarking}</strong> for incorrect answers
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Time limit: <strong>{quiz.settings.timeLimit} minutes</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Passing score: <strong>{quiz.settings.passingPercentage}%</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {quizPreview.previousResults && quizPreview.previousResults.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-8">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                    Previous Attempts
                                </h3>
                                <div className="space-y-2">
                                    {quizPreview.previousResults.slice(0, 3).map((result: any, index: number) => (
                                        <div key={index} className="text-sm text-blue-800 dark:text-blue-300">
                                            Attempt {index + 1}: {result.percentage.toFixed(1)}% ({result.marksObtained}/{result.totalMarks})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!quizPreview.canAttempt && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
                                <p className="text-red-800 dark:text-red-200">
                                    You have reached the maximum number of attempts for this quiz.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/my-quizzes')}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Back to Quizzes
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                disabled={starting || !quizPreview.canAttempt}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {starting ? 'Starting...' : 'Start Quiz'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Quiz in progress
    if (!currentQuiz || !attemptId || timeRemaining === null) {
        return null;
    }

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const answeredCount = answers.size;
    const progress = (answeredCount / currentQuiz.totalQuestions) * 100;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Timer */}
            <QuizTimer
                timeRemaining={timeRemaining}
                totalTime={currentQuiz.settings.timeLimit * 60}
                onTimeUp={handleTimeUp}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Progress */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Progress: {answeredCount} / {currentQuiz.totalQuestions} answered
                                </span>
                                <span className="text-sm font-semibold text-indigo-600">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Question */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <QuestionDisplay
                                    question={currentQuestion}
                                    questionNumber={currentQuestionIndex + 1}
                                    selectedAnswer={getAnswer(currentQuestion._id || '')}
                                    onAnswerSelect={(answer) =>
                                        handleAnswerSelect(currentQuestion._id || '', answer)
                                    }
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowSubmitConfirm(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Question Navigation Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-24">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                Questions
                            </h3>
                            <div className="grid grid-cols-5 gap-2">
                                {currentQuiz.questions.map((q, index) => {
                                    const isAnswered = answers.has(q._id || '');
                                    const isCurrent = index === currentQuestionIndex;

                                    return (
                                        <button
                                            key={q._id}
                                            onClick={() => jumpToQuestion(index)}
                                            className={`aspect-square rounded-lg font-semibold text-sm transition-all ${isCurrent
                                                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2'
                                                    : isAnswered
                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowSubmitConfirm(true)}
                                    disabled={submitting}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                >
                                    Submit Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Submit Quiz?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            You have answered <strong>{answeredCount}</strong> out of{' '}
                            <strong>{currentQuiz.totalQuestions}</strong> questions.
                        </p>
                        {answeredCount < currentQuiz.totalQuestions && (
                            <p className="text-orange-600 dark:text-orange-400 mb-4">
                                <strong>Warning:</strong> You have{' '}
                                {currentQuiz.totalQuestions - answeredCount} unanswered questions.
                            </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to submit?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitQuiz(false)}
                                disabled={submitting}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default QuizAttempt;
