import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, RefreshCw, MessageSquare } from 'lucide-react';
import DoubtItem from '../../components/doubts/DoubtItem';
import { doubtAPI } from '../../services/doubtAPI';
import type { Doubt } from '../../types';
import { useToastStore } from '../../store/useToastStore';

const MyDoubts: React.FC = () => {
    const navigate = useNavigate();
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        search: '',
    });

    const { addToast } = useToastStore();

    const fetchDoubts = async () => {
        try {
            setLoading(true);
            const response = await doubtAPI.getMyDoubts({
                ...(filters.status && { status: filters.status }),
                ...(filters.category && { category: filters.category }),
            });
            let doubtsData = response.data || [];

            // Apply search filter on client side
            if (filters.search) {
                doubtsData = doubtsData.filter(
                    (doubt: Doubt) =>
                        doubt.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
                        doubt.description.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            setDoubts(doubtsData);
        } catch (error) {
            console.error('Error fetching doubts:', error);
            addToast({ message: 'Failed to load doubts', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoubts();
    }, [filters.status, filters.category]);

    const handleDeleteDoubt = async (doubtId: string) => {
        if (!window.confirm('Are you sure you want to delete this doubt?')) {
            return;
        }

        try {
            await doubtAPI.deleteDoubt(doubtId);
            addToast({ message: 'Doubt deleted successfully', type: 'success' });
            fetchDoubts();
        } catch (error: any) {
            console.error('Error deleting doubt:', error);
            addToast({
                message: error.response?.data?.message || 'Failed to delete doubt',
                type: 'error'
            });
        }
    };

    const stats = {
        total: doubts.length,
        pending: doubts.filter((d) => d.status === 'pending').length,
        inProgress: doubts.filter((d) => d.status === 'in-progress').length,
        resolved: doubts.filter((d) => d.status === 'resolved').length,
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            My Doubts
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Ask questions and get help from our expert team
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/doubts/submit')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        Ask a Doubt
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Doubts', value: stats.total, color: 'blue' },
                        { label: 'Pending', value: stats.pending, color: 'yellow' },
                        { label: 'In Progress', value: stats.inProgress, color: 'blue' },
                        { label: 'Resolved', value: stats.resolved, color: 'green' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                {stat.label}
                            </p>
                            <p className={`text-3xl font-bold text-${stat.color}-600`}>
                                {stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search doubts..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && fetchDoubts()}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            <option value="course">Course Related</option>
                            <option value="general">General</option>
                            <option value="technical">Technical</option>
                            <option value="other">Other</option>
                        </select>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchDoubts}
                            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Doubts List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : doubts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-md">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No doubts found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {filters.status || filters.category || filters.search
                                ? 'Try adjusting your filters'
                                : 'Start by asking your first question'}
                        </p>
                        <button
                            onClick={() => navigate('/doubts/submit')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                        >
                            Ask Your First Doubt
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {doubts.map((doubt) => (
                            <DoubtItem
                                key={doubt._id || doubt.id}
                                doubt={doubt}
                                onClick={() => setSelectedDoubt(doubt)}
                            />
                        ))}
                    </div>
                )}

                {/* Doubt Detail Modal */}
                {selectedDoubt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            {selectedDoubt.subject}
                                        </h2>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                                        <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-45" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Description
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedDoubt.description}
                                    </p>
                                </div>

                                {selectedDoubt.response && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                            Admin Response
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

                                {!selectedDoubt.response && selectedDoubt.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDeleteDoubt(selectedDoubt._id || selectedDoubt.id || '')}
                                            className="px-6 py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            Delete Doubt
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDoubts;
