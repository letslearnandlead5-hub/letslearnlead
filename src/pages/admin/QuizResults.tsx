import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Download,
    TrendingUp,
    Award,
    CheckCircle,
    XCircle,
    Users,
} from 'lucide-react';
import { getQuizResults } from '../../services/quizService';
import { formatTime } from '../../services/quizService';
import toast from 'react-hot-toast';

const QuizResults: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [results, setResults] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, [quizId]);

    const fetchResults = async () => {
        if (!quizId) return;

        try {
            setLoading(true);
            const response = await getQuizResults(quizId);
            console.log('Quiz Results API Response:', response);
            
            // The results are in response.data (Array)
            const resultsData = response.data || [];
            const statsData = response.stats || {};
            const quizData = response.quiz || {};
            
            console.log('Parsed results:', resultsData);
            console.log('Parsed stats:', statsData);
            
            setResults(resultsData);
            setStats(statsData);
            setQuiz(quizData);
        } catch (error: any) {
            console.error('Error fetching results:', error);
            toast.error(error.response?.data?.message || 'Failed to load results');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (results.length === 0) {
            toast.error('No results to export');
            return;
        }

        const headers = [
            'Student Name',
            'Email',
            'Marks Obtained',
            'Total Marks',
            'Percentage',
            'Pass/Fail',
            'Time Taken',
            'Correct Answers',
            'Incorrect Answers',
            'Unanswered',
            'Rank',
            'Attempt Date',
        ];

        const rows = results.map((result) => [
            result.studentName,
            result.studentEmail,
            result.marksObtained,
            result.totalMarks,
            result.percentage.toFixed(2),
            result.isPassed ? 'Pass' : 'Fail',
            formatTime(result.timeTaken),
            result.correctAnswers,
            result.incorrectAnswers,
            result.unansweredQuestions,
            result.rank || '-',
            new Date(result.createdAt).toLocaleDateString(),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-results-${quiz.title}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Results exported successfully');
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
                    <button
                        onClick={() => navigate('/admin/quizzes')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Quizzes
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Quiz Results
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">{quiz.title}</p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Total Attempts
                                </span>
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.totalAttempts}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Average Score
                                </span>
                                <Award className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.averagePercentage?.toFixed(1)}%
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Highest Score</span>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.highestScore}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Pass Rate</span>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {stats.passRate?.toFixed(1)}%
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Results Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {results.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No Results Yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Results will appear here once students complete the quiz
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Percentage
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Correct
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {results.map((result, index) => (
                                        <motion.tr
                                            key={result._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    #{result.rank || index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {result.studentName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {result.studentEmail}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {result.marksObtained} / {result.totalMarks}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {result.percentage.toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {result.isPassed ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Pass
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                                        <XCircle className="w-3 h-3" />
                                                        Fail
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {result.correctAnswers} / {result.totalQuestions}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatTime(result.timeTaken)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizResults;
