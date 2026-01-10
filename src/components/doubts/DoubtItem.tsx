import React from 'react';
import { Clock, MessageSquare, BookOpen, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { Doubt } from '../../types';
import { motion } from 'framer-motion';

interface DoubtItemProps {
    doubt: Doubt;
    onClick?: () => void;
    showStudentInfo?: boolean;
}

const DoubtItem: React.FC<DoubtItemProps> = ({ doubt, onClick, showStudentInfo = false }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'in-progress':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'resolved':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-orange-500';
            case 'low':
                return 'text-gray-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <AlertCircle className="w-4 h-4" />;
            case 'in-progress':
                return <Loader className="w-4 h-4" />;
            case 'resolved':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'course':
                return <BookOpen className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return d.toLocaleDateString();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer' : ''
                }`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-primary/10 ${getPriorityColor(doubt.priority)}`}>
                            {getCategoryIcon(doubt.category)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                {doubt.subject}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDate(doubt.createdAt)}
                                </span>
                                {doubt.courseName && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            {doubt.courseName}
                                        </span>
                                    </>
                                )}
                                {showStudentInfo && (
                                    <>
                                        <span>•</span>
                                        <span>{doubt.studentName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">
                        {doubt.description}
                    </p>

                    {/* Response preview */}
                    {doubt.response && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                Admin Response:
                            </p>
                            <p className="text-sm text-green-800 dark:text-green-200 line-clamp-2">
                                {doubt.response}
                            </p>
                        </div>
                    )}
                </div>

                {/* Status and Priority Badges */}
                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                            doubt.status
                        )}`}
                    >
                        {getStatusIcon(doubt.status)}
                        {doubt.status.charAt(0).toUpperCase() + doubt.status.slice(1)}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(doubt.priority)}`}>
                        {doubt.priority.toUpperCase()} Priority
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default DoubtItem;
