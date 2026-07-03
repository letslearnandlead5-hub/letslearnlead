import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, CheckCircle, XCircle, Clock, Eye, ChevronDown,
    RefreshCw, DollarSign, User, BookOpen, Hash, Calendar, Phone, Mail, MessageSquare
} from 'lucide-react';
import { paymentAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';

interface Payment {
    _id: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    courseName: string;
    amount: number;
    currency: string;
    transactionId: string;
    paymentScreenshot?: string;
    paymentStatus: 'pending' | 'approved' | 'rejected';
    paymentDate: string;
    adminRemark?: string;
    notes?: string;
    createdAt: string;
    studentId?: { name: string; email: string; profilePicture?: string };
    courseId?: { title: string; thumbnail: string; price: number };
    verifiedBy?: { name: string };
    verifiedDate?: string;
}

interface Summary { pending: number; approved: number; rejected: number; }

const statusConfig = {
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
    approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', badge: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' },
    rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', badge: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' },
};

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
        <div className="mt-3 flex gap-2">
            <div className="h-9 flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="h-9 flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
    </div>
);

const PaymentManagement: React.FC = () => {
    const { addToast } = useToastStore();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [search, setSearch] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState('');
    const [adminRemark, setAdminRemark] = useState('');
    const [actionLoading, setActionLoading] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { page, limit: 12 };
            if (activeStatus !== 'all') params.status = activeStatus;
            if (search.trim()) params.search = search.trim();
            const res: any = await paymentAPI.getAll(params);
            setPayments(res.data || []);
            setSummary(res.summary || { pending: 0, approved: 0, rejected: 0 });
            setTotalPages(res.pages || 1);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    }, [activeStatus, search, page]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleApprove = async (payment: Payment) => {
        try {
            setActionLoading(payment._id);
            await paymentAPI.approve(payment._id, { adminRemark: '' });
            addToast({ type: 'success', message: `Payment approved! ${payment.studentName} has been enrolled.` });
            fetchPayments();
        } catch (err: any) {
            addToast({ type: 'error', message: err?.message || 'Failed to approve payment' });
        } finally {
            setActionLoading('');
        }
    };

    const handleRejectSubmit = async () => {
        if (!adminRemark.trim()) {
            addToast({ type: 'error', message: 'Please provide a rejection reason' });
            return;
        }
        try {
            setActionLoading(rejectingId);
            await paymentAPI.reject(rejectingId, { adminRemark: adminRemark.trim() });
            addToast({ type: 'success', message: 'Payment rejected and student notified.' });
            setShowRejectModal(false);
            setAdminRemark('');
            fetchPayments();
        } catch (err: any) {
            addToast({ type: 'error', message: err?.message || 'Failed to reject payment' });
        } finally {
            setActionLoading('');
        }
    };

    const openRejectModal = (payment: Payment) => {
        setRejectingId(payment._id);
        setAdminRemark('');
        setShowRejectModal(true);
    };

    const tabs = [
        { id: 'pending' as const, label: 'Pending', count: summary.pending },
        { id: 'approved' as const, label: 'Approved', count: summary.approved },
        { id: 'rejected' as const, label: 'Rejected', count: summary.rejected },
        { id: 'all' as const, label: 'All', count: summary.pending + summary.approved + summary.rejected },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and verify student course payments</p>
                </div>
                <button onClick={fetchPayments} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {([['pending', 'Pending', 'bg-amber-500'], ['approved', 'Approved', 'bg-green-500'], ['rejected', 'Rejected', 'bg-red-500']] as const).map(([key, label, color]) => (
                    <button key={key} onClick={() => { setActiveStatus(key); setPage(1); }} className={`p-4 rounded-2xl border-2 transition-all text-left ${activeStatus === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-2`}>
                            {key === 'pending' && <Clock className="w-4 h-4 text-white" />}
                            {key === 'approved' && <CheckCircle className="w-4 h-4 text-white" />}
                            {key === 'rejected' && <XCircle className="w-4 h-4 text-white" />}
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary[key as keyof Summary]}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, transaction ID, course..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* Tab filters */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveStatus(tab.id); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeStatus === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {tab.label}
                            <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Cards */}
            {loading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">No payments found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {search ? 'Try a different search term' : `No ${activeStatus === 'all' ? '' : activeStatus} payments yet`}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {payments.map(payment => {
                        const cfg = statusConfig[payment.paymentStatus];
                        const StatusIcon = cfg.icon;
                        return (
                            <motion.div
                                key={payment._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white dark:bg-gray-900 rounded-2xl border ${cfg.bg} p-5 hover:shadow-md transition-shadow`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                            {payment.studentName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{payment.studentName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{payment.studentEmail}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                            <BookOpen className="w-3 h-3" />Course
                                        </p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{payment.courseName}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                            <DollarSign className="w-3 h-3" />Amount
                                        </p>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{payment.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 col-span-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-0.5">
                                            <Hash className="w-3 h-3" />Transaction ID
                                        </p>
                                        <p className="text-xs font-mono font-semibold text-gray-900 dark:text-white break-all">{payment.transactionId}</p>
                                    </div>
                                </div>

                                {/* Date */}
                                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mb-3">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {/* Admin Remark */}
                                {payment.adminRemark && (
                                    <div className={`text-xs p-2 rounded-lg mb-3 ${payment.paymentStatus === 'rejected' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'}`}>
                                        <strong>Admin note:</strong> {payment.adminRemark}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }}
                                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Eye className="w-3.5 h-3.5" />View Details
                                    </button>
                                    {payment.paymentStatus === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(payment)}
                                                disabled={actionLoading === payment._id}
                                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                                            >
                                                {actionLoading === payment._id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(payment)}
                                                disabled={actionLoading === payment._id}
                                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setShowDetailModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold text-lg">Payment Details</h3>
                                    <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <XCircle className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    { icon: User, label: 'Student Name', value: selectedPayment.studentName },
                                    { icon: Mail, label: 'Email', value: selectedPayment.studentEmail },
                                    { icon: Phone, label: 'Phone', value: selectedPayment.studentPhone },
                                    { icon: BookOpen, label: 'Course', value: selectedPayment.courseName },
                                    { icon: DollarSign, label: 'Amount', value: `₹${selectedPayment.amount.toLocaleString()}` },
                                    { icon: Hash, label: 'Transaction ID', value: selectedPayment.transactionId, mono: true },
                                    { icon: Calendar, label: 'Submitted At', value: new Date(selectedPayment.createdAt).toLocaleString('en-IN') },
                                ].map(({ icon: Icon, label, value, mono }) => (
                                    <div key={label} className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                                            <p className={`text-sm font-medium text-gray-900 dark:text-white break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                                {selectedPayment.notes && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.notes}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedPayment.paymentScreenshot && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Payment Screenshot</p>
                                        <img src={selectedPayment.paymentScreenshot} alt="Payment screenshot" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 object-contain max-h-60" />
                                    </div>
                                )}
                                {selectedPayment.adminRemark && (
                                    <div className={`p-3 rounded-xl text-sm ${selectedPayment.paymentStatus === 'rejected' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'}`}>
                                        <strong>Admin Remark:</strong> {selectedPayment.adminRemark}
                                    </div>
                                )}
                                {selectedPayment.paymentStatus === 'pending' && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => { handleApprove(selectedPayment); setShowDetailModal(false); }}
                                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle className="w-4 h-4" />Approve
                                        </button>
                                        <button
                                            onClick={() => { openRejectModal(selectedPayment); setShowDetailModal(false); }}
                                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle className="w-4 h-4" />Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={() => setShowRejectModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Reject Payment</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Student will be notified with your reason</p>
                                </div>
                            </div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                            <textarea
                                value={adminRemark}
                                onChange={e => setAdminRemark(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
                                placeholder="e.g. Transaction ID not found, invalid amount, screenshot unclear..."
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={!!actionLoading}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                                >
                                    {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Confirm Reject
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentManagement;
