import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Clock, Calendar } from 'lucide-react';
import { getQuizLeaderboard } from '../../services/quizService';
import { formatTime } from '../../services/quizService';
import type { LeaderboardEntry } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const QuizLeaderboard: React.FC = () => {
    const { id: quizId } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [quizId]);

    const fetchLeaderboard = async () => {
        if (!quizId) return;

        try {
            setLoading(true);
            const data = await getQuizLeaderboard(quizId);
            setLeaderboard(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-orange-600" />;
            default:
                return null;
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20';
            case 2:
                return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20';
            case 3:
                return 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20';
            default:
                return 'bg-white dark:bg-gray-800';
        }
    };

    const isCurrentUser = (entry: LeaderboardEntry) => {
        return user?.name === entry.studentName;
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Leaderboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Top performers in this quiz
                    </p>
                </div>

                {/* Podium */}
                {leaderboard.length >= 3 && (
                    <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                        {/* 2nd Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center pt-8"
                        >
                            <div className="relative inline-block mb-3">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {leaderboard[1].studentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                                    2
                                </div>
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {leaderboard[1].studentName}
                            </div>
                            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                {leaderboard[1].percentage.toFixed(1)}%
                            </div>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="relative inline-block mb-3">
                                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                                    {leaderboard[0].studentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                    <Trophy className="w-8 h-8 text-yellow-500" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                                    1
                                </div>
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                                {leaderboard[0].studentName}
                            </div>
                            <div className="text-xl font-bold text-yellow-600">
                                {leaderboard[0].percentage.toFixed(1)}%
                            </div>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center pt-12"
                        >
                            <div className="relative inline-block mb-3">
                                <div className="w-18 h-18 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {leaderboard[2].studentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                    3
                                </div>
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {leaderboard[2].studentName}
                            </div>
                            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                {leaderboard[2].percentage.toFixed(1)}%
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {leaderboard.map((entry, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`${getRankBg(entry.rank)} ${isCurrentUser(entry)
                                            ? 'ring-2 ring-indigo-500 ring-inset'
                                            : ''
                                            } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getRankIcon(entry.rank)}
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {entry.rank}
                                                </span>
                                                {isCurrentUser(entry) && (
                                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {entry.studentName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {entry.marksObtained} / {entry.totalMarks}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                {entry.percentage.toFixed(1)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatTime(entry.timeTaken)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {new Date(entry.attemptDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {leaderboard.length === 0 && (
                    <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No results yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Be the first to complete this quiz!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizLeaderboard;
