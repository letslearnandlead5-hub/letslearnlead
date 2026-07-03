import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, BookOpen, DollarSign,
    Hash, Calendar, RefreshCw, CreditCard
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

const statusConfig = {
    pending: {
        label: 'Pending Verification',
        icon: Clock,
        badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
        cardBorder: 'border-amber-200 dark:border-amber-900',
        description: 'Our team is reviewing your payment',
    },
    approved: {
        label: 'Approved',
        icon: CheckCircle,
        badgeClass: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        cardBorder: 'border-green-200 dark:border-green-900',
        description: 'You now have full course access',
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        badgeClass: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        cardBorder: 'border-red-200 dark:border-red-900',
        description: 'Payment could not be verified',
    },
};

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
        <div className="flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-28" />
            </div>
        </div>
    </div>
);

const MyPayments: React.FC = () => {
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

    const filtered = filter === 'all' ? payments : payments.filter(p => p.paymentStatus === filter);

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Payments</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your course payment status</p>
                </div>
                <button onClick={fetchPayments} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                {([
                    ['pending', 'Pending', 'bg-amber-500', 'text-amber-600 dark:text-amber-400'],
                    ['approved', 'Approved', 'bg-green-500', 'text-green-600 dark:text-green-400'],
                    ['rejected', 'Rejected', 'bg-red-500', 'text-red-600 dark:text-red-400'],
                ] as const).map(([key, label, bg, text]) => (
                    <button key={key} onClick={() => setFilter(key)} className={`p-4 rounded-2xl border-2 transition-all text-center ${filter === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                        <p className={`text-2xl font-bold ${text}`}>{summary[key as keyof Summary]}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                    </button>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">No payments yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse courses and enroll to see payments here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((payment, idx) => {
                        const cfg = statusConfig[payment.paymentStatus];
                        const StatusIcon = cfg.icon;
                        return (
                            <motion.div
                                key={payment._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${cfg.cardBorder} p-5 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex gap-4">
                                    {/* Course Thumbnail */}
                                    <div className="flex-shrink-0">
                                        {payment.courseId?.thumbnail ? (
                                            <img src={payment.courseId.thumbnail} alt={payment.courseName} className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-800" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                                                <BookOpen className="w-7 h-7 text-indigo-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{payment.courseName}</p>
                                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badgeClass}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{cfg.description}</p>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                <strong className="text-indigo-600 dark:text-indigo-400">₹{payment.amount.toLocaleString()}</strong>
                                            </span>
                                            <span className="flex items-center gap-1 font-mono">
                                                <Hash className="w-3 h-3" />
                                                {payment.transactionId}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Admin Remark */}
                                        {payment.adminRemark && (
                                            <div className={`mt-2.5 p-2.5 rounded-xl text-xs ${payment.paymentStatus === 'rejected' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'}`}>
                                                <strong>Admin note:</strong> {payment.adminRemark}
                                            </div>
                                        )}

                                        {/* Hint for rejected */}
                                        {payment.paymentStatus === 'rejected' && (
                                            <a href="/courses/" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                                Try again →
                                            </a>
                                        )}

                                        {/* Hint for approved */}
                                        {payment.paymentStatus === 'approved' && payment.courseId?._id && (
                                            <a href={`/courses/${payment.courseId._id}/`} className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline font-medium">
                                                Go to course →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyPayments;
