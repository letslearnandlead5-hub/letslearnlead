import React, { useState, useEffect } from 'react';
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

const statusConfig = {
    pending: {
        label: 'Pending Verification',
        icon: Clock,
        iconColor: 'text-amber-500 dark:text-amber-400',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50',
        cardBorder: 'border-amber-200/60 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-800',
        cardBg: 'bg-gradient-to-r from-amber-50/30 to-transparent dark:from-amber-950/10 dark:to-transparent',
        description: 'Our team is verifying your payment details.',
    },
    approved: {
        label: 'Payment Approved',
        icon: CheckCircle,
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50',
        cardBorder: 'border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800',
        cardBg: 'bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-950/10 dark:to-transparent',
        description: 'Verification successful. You have full access!',
    },
    rejected: {
        label: 'Payment Rejected',
        icon: XCircle,
        iconColor: 'text-red-500 dark:text-red-400',
        badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-900/50',
        cardBorder: 'border-red-200/60 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-800',
        cardBg: 'bg-gradient-to-r from-red-50/30 to-transparent dark:from-red-950/10 dark:to-transparent',
        description: 'Verification failed. Please review the admin note.',
    },
};

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/80 p-6 animate-pulse space-y-4">
        <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-850 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-850 rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-850 rounded w-1/3" />
            </div>
        </div>
        <div className="h-8 bg-gray-150 dark:bg-gray-850 rounded-lg w-full" />
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
        <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800/60">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Payments</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage your course subscription payments</p>
                </div>
                <button 
                    onClick={fetchPayments} 
                    className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 active:scale-95 transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                    ['pending', 'Pending Verification', summary.pending, Clock, 'text-amber-500 dark:text-amber-400 bg-amber-500/10'],
                    ['approved', 'Approved Access', summary.approved, CheckCircle, 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10'],
                    ['rejected', 'Rejected Payments', summary.rejected, XCircle, 'text-red-500 dark:text-red-400 bg-red-500/10'],
                ] as const).map(([key, label, count, Icon, style]) => (
                    <button 
                        key={key} 
                        onClick={() => setFilter(key)} 
                        className={`group relative overflow-hidden p-5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                            filter === key 
                                ? 'border-primary-500 dark:border-primary-500 bg-primary-500/[0.03] shadow-md shadow-primary-500/5 ring-1 ring-primary-500/30' 
                                : 'border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                    >
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{count}</p>
                        </div>
                        <div className={`p-3.5 rounded-xl ${style} group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100/80 dark:bg-gray-800/80 rounded-xl p-1 w-fit border border-gray-200/20">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all capitalize ${
                            filter === f 
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {f === 'all' ? 'Show All' : f}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800/80">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 rounded-2xl flex items-center justify-center mb-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No transactions found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                        {filter === 'all' 
                            ? 'Browse courses and complete your payment to get enrolled.' 
                            : `There are currently no ${filter} payments.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((payment, idx) => {
                        const cfg = statusConfig[payment.paymentStatus];
                        const StatusIcon = cfg.icon;
                        return (
                            <motion.div
                                key={payment._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`bg-white dark:bg-gray-900 rounded-3xl border-2 ${cfg.cardBorder} p-6 shadow-sm hover:shadow-md transition-all ${cfg.cardBg}`}
                            >
                                <div className="flex flex-col md:flex-row gap-5 items-start">
                                    {/* Course Thumbnail */}
                                    <div className="w-full md:w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-850 shadow-inner flex-shrink-0">
                                        {payment.courseId?.thumbnail ? (
                                            <img src={payment.courseId.thumbnail} alt={payment.courseName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-primary-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 min-w-0 w-full space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight line-clamp-1">{payment.courseName}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.description}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full w-fit ${cfg.badgeClass}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Meta Stats List */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                                                    <IndianRupee className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Amount Paid</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">₹{payment.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                                                    <Hash className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Transaction ID</p>
                                                    <p className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate" title={payment.transactionId}>
                                                        {payment.transactionId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feedback Remark */}
                                        {payment.adminRemark && (
                                            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                                                payment.paymentStatus === 'rejected' 
                                                    ? 'bg-red-500/[0.04] text-red-800 dark:text-red-400 border border-red-500/10' 
                                                    : 'bg-emerald-500/[0.04] text-emerald-800 dark:text-emerald-400 border border-emerald-500/10'
                                            }`}>
                                                <span className="font-extrabold uppercase tracking-wider block mb-1">Remarks:</span> 
                                                {payment.adminRemark}
                                            </div>
                                        )}

                                        {/* Action / Context CTA */}
                                        {payment.paymentStatus === 'rejected' && (
                                            <a 
                                                href={`/courses/${payment.courseId?._id || ''}`} 
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-350 transition-colors"
                                            >
                                                Try submitting payment details again <ChevronRight className="w-3.5 h-3.5" />
                                            </a>
                                        )}

                                        {payment.paymentStatus === 'approved' && payment.courseId?._id && (
                                            <a 
                                                href={`/courses/${payment.courseId._id}/`} 
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-xl shadow-sm shadow-emerald-500/10"
                                            >
                                                Go to Course <ChevronRight className="w-3.5 h-3.5" />
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
