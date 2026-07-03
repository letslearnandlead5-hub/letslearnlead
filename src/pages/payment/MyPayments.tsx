import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, BookOpen, IndianRupee,
    Hash, Calendar, RefreshCw, CreditCard, ChevronRight
} from 'lucide-react';
import { paymentAPI } from '../../services/api';

interface Payment {
    _id: string;
    courseName: string;
    amount: number;
    currency: string;
    transactionId: string;
    paymentStatus: 'pending' | 'approved' | 'rejected';
    paymentDate: string;
    adminRemark?: string;
    notes?: string;
    createdAt: string;
    courseId?: { title: string; thumbnail: string; _id: string };
}

interface Summary { pending: number; approved: number; rejected: number; }

const MyPayments: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res: any = await paymentAPI.getMyPayments();
            setPayments(res.data || []);
            setSummary(res.summary || { pending: 0, approved: 0, rejected: 0 });
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayments(); }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'approved':
                return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'rejected':
                return 'bg-red-500/10 text-red-600 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <CreditCard className="w-4 h-4" />;
        }
    };

    const filtered = filter === 'all' ? payments : payments.filter(p => p.paymentStatus === filter);

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            My Payments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track and manage your course subscription payments
                        </p>
                    </div>
                    <button
                        onClick={fetchPayments}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Payments', value: summary.pending + summary.approved + summary.rejected, color: 'blue' },
                        { label: 'Pending Verification', value: summary.pending, color: 'yellow' },
                        { label: 'Approved Access', value: summary.approved, color: 'green' },
                        { label: 'Rejected Payments', value: summary.rejected, color: 'red' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
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
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</span>
                        <div className="flex gap-2">
                            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all capitalize border ${
                                        filter === f
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {f === 'all' ? 'Show All' : f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payments List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-md border border-gray-200 dark:border-gray-700">
                        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No transactions found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {filter === 'all'
                                ? 'Browse courses and complete your payment to get enrolled.'
                                : `There are currently no ${filter} payments.`}
                        </p>
                        <button
                            onClick={() => navigate('/courses')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md"
                        >
                            Browse Courses
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((payment) => (
                            <motion.div
                                key={payment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 flex gap-4 items-start">
                                        {/* Course Thumbnail */}
                                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm bg-gray-50 dark:bg-gray-900">
                                            {payment.courseId?.thumbnail ? (
                                                <img src={payment.courseId.thumbnail} alt={payment.courseName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary-500">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                    {payment.courseName}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <IndianRupee className="w-3.5 h-3.5" />
                                                        <strong className="text-gray-900 dark:text-white">
                                                            {payment.amount.toLocaleString()}
                                                        </strong>
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Hash className="w-3.5 h-3.5" />
                                                        {payment.transactionId}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Admin Remark Response */}
                                            {payment.adminRemark && (
                                                <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                                                    payment.paymentStatus === 'rejected'
                                                        ? 'bg-red-50 dark:bg-red-950/20 text-red-805 dark:text-red-400 border-red-200 dark:border-red-900'
                                                        : 'bg-green-50 dark:bg-green-950/20 text-green-805 dark:text-green-400 border-green-200 dark:border-green-900'
                                                }`}>
                                                    <span className="font-semibold block mb-0.5">Admin Note:</span>
                                                    {payment.adminRemark}
                                                </div>
                                            )}

                                            {/* Action Redirect links */}
                                            {payment.paymentStatus === 'approved' && payment.courseId?._id && (
                                                <button
                                                    onClick={() => navigate(`/video/${payment.courseId?._id}/${payment.courseId?._id}`)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors rounded-lg shadow-sm"
                                                >
                                                    Go to Course <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {payment.paymentStatus === 'rejected' && (
                                                <button
                                                    onClick={() => navigate(`/courses/${payment.courseId?._id || ''}`)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Submit details again <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                                            payment.paymentStatus
                                        )}`}
                                    >
                                        {getStatusIcon(payment.paymentStatus)}
                                        {payment.paymentStatus === 'pending' ? 'Pending' : payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPayments;
