import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    RefreshCw,
    MessageSquare,
    CheckCircle,
    Clock,
    X,
    Send,
    TrendingUp,
} from 'lucide-react';
import DoubtItem from '../../components/doubts/DoubtItem';
import { doubtAPI } from '../../services/doubtAPI';
import type { Doubt, DoubtStatistics } from '../../types';
import { useToastStore } from '../../store/useToastStore';

const DoubtManagement: React.FC = () => {
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [statistics, setStatistics] = useState<DoubtStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState<'pending' | 'in-progress' | 'resolved'>(
        'resolved'
    );
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
        search: '',
    });

    const { addToast } = useToastStore();

    const fetchDoubts = async () => {
        try {
            setLoading(true);
            const response = await doubtAPI.getAllDoubts({
                ...(filters.status && { status: filters.status }),
                ...(filters.category && { category: filters.category }),
                ...(filters.priority && { priority: filters.priority }),
                ...(filters.search && { search: filters.search }),
            });
            setDoubts(response.data || []);
        } catch (error) {
            console.error('Error fetching doubts:', error);
            addToast({ message: 'Failed to load doubts', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await doubtAPI.getDoubtStatistics();
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    useEffect(() => {
        fetchDoubts();
        fetchStatistics();
    }, [filters.status, filters.category, filters.priority]);

    const handleRespond = async () => {
        if (!selectedDoubt || !responseText.trim()) {
            addToast({ message: 'Please enter a response', type: 'error' });
            return;
        }

        try {
            await doubtAPI.respondToDoubt(selectedDoubt._id || selectedDoubt.id || '', {
                response: responseText,
                status: responseStatus,
            });
            addToast({ message: 'Response sent successfully', type: 'success' });
            setSelectedDoubt(null);
            setResponseText('');
            fetchDoubts();
            fetchStatistics();
        } catch (error) {
            console.error('Error responding to doubt:', error);
            addToast({ message: 'Failed to send response', type: 'error' });
        }
    };

    const handleUpdateStatus = async (doubtId: string, status: 'pending' | 'in-progress' | 'resolved') => {
        try {
            await doubtAPI.updateDoubtStatus(doubtId, status);
            addToast({ message: 'Status updated successfully', type: 'success' });
            fetchDoubts();
            fetchStatistics();
        } catch (error) {
            console.error('Error updating status:', error);
            addToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const handleDeleteDoubt = async (doubtId: string) => {
        if (!window.confirm('Are you sure you want to delete this doubt?')) {
            return;
        }

        try {
            await doubtAPI.deleteDoubtAdmin(doubtId);
            addToast({ message: 'Doubt deleted successfully', type: 'success' });
            setSelectedDoubt(null);
            fetchDoubts();
            fetchStatistics();
        } catch (error) {
            console.error('Error deleting doubt:', error);
            addToast({ message: 'Failed to delete doubt', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 opacity-80" />
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Total
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{statistics.totalDoubts}</p>
                        <p className="text-blue-100 text-sm">All Doubts</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 opacity-80" />
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Pending
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{statistics.pendingDoubts}</p>
                        <p className="text-yellow-100 text-sm">Awaiting Response</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 opacity-80" />
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Today
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{statistics.resolvedToday}</p>
                        <p className="text-green-100 text-sm">Resolved Today</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 opacity-80" />
                            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                Avg
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            {statistics.averageResponseTime.toFixed(1)}h
                        </p>
                        <p className="text-purple-100 text-sm">Response Time</p>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by subject, description, or student..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDoubts()}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        <option value="course">Course</option>
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="other">Other</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={() => {
                            fetchDoubts();
                            fetchStatistics();
                        }}
                        className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Doubts List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : doubts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-md">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No doubts found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {filters.status || filters.category || filters.priority || filters.search
                            ? 'Try adjusting your filters'
                            : 'No students have submitted any doubts yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {doubts.map((doubt) => (
                        <DoubtItem
                            key={doubt._id || doubt.id}
                            doubt={doubt}
                            onClick={() => setSelectedDoubt(doubt)}
                            showStudentInfo={true}
                        />
                    ))}
                </div>
            )}

            {/* Doubt Detail & Response Modal */}
            {selectedDoubt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {selectedDoubt.subject}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span>Student: {selectedDoubt.studentName}</span>
                                        <span>•</span>
                                        <span>Status: {selectedDoubt.status}</span>
                                        <span>•</span>
                                        <span>Priority: {selectedDoubt.priority}</span>
                                        {selectedDoubt.courseName && (
                                            <>
                                                <span>•</span>
                                                <span>{selectedDoubt.courseName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDoubt(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Doubt Description */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Student's Question
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    {selectedDoubt.description}
                                </p>
                            </div>

                            {/* Existing Response (if any) */}
                            {selectedDoubt.response && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                        Your Previous Response
                                    </h3>
                                    <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                                        {selectedDoubt.response}
                                    </p>
                                    {selectedDoubt.respondedAt && (
                                        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                                            Responded on{' '}
                                            {new Date(selectedDoubt.respondedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Response Form */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {selectedDoubt.response ? 'Update Response' : 'Respond to Doubt'}
                                </h3>

                                {/* Status Selection */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Set Status
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['pending', 'in-progress', 'resolved'] as const).map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setResponseStatus(status)}
                                                className={`py-2 px-4 rounded-xl border-2 font-medium transition-all ${responseStatus === status
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {status.charAt(0).toUpperCase() +
                                                    status.slice(1).replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Response Textarea */}
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Type your response here..."
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleRespond}
                                        disabled={!responseText.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send Response
                                    </button>

                                    {selectedDoubt.status !== 'resolved' && !responseText && (
                                        <button
                                            onClick={() =>
                                                handleUpdateStatus(selectedDoubt._id || selectedDoubt.id || '', 'in-progress')
                                            }
                                            className="px-6 py-3 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        >
                                            Mark In Progress
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeleteDoubt(selectedDoubt._id || selectedDoubt.id || '')}
                                        className="ml-auto px-6 py-3 border border-red-500 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DoubtManagement;
