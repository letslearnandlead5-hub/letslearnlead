import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Copy, CheckCircle, Clock, Upload, AlertCircle, ChevronRight, QrCode, Smartphone
} from 'lucide-react';
import { paymentAPI } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

interface Course {
    _id: string;
    title: string;
    instructor: string;
    thumbnail: string;
    price: number;
    currency?: string;
    qrImage?: string;
    upiId?: string;
    merchantName?: string;
    paymentInstructions?: string;
}

interface Props {
    course: Course;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type Step = 'qr' | 'form' | 'success';

const PaymentModal: React.FC<Props> = ({ course, isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore();
    const { addToast } = useToastStore();

    const [step, setStep] = useState<Step>('qr');
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [screenshotPreview, setScreenshotPreview] = useState<string>('');

    const [form, setForm] = useState({
        studentName: user?.name || '',
        studentEmail: user?.email || '',
        studentPhone: '',
        transactionId: '',
        paymentScreenshot: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setStep('qr');
            setErrors({});
            setScreenshotPreview('');
            setForm(prev => ({ ...prev, studentName: user?.name || '', studentEmail: user?.email || '' }));
        }
    }, [isOpen, user]);

    const handleCopyUPI = useCallback(() => {
        if (course.upiId) {
            navigator.clipboard.writeText(course.upiId).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }, [course.upiId]);

    const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            setErrors(prev => ({ ...prev, paymentScreenshot: 'Only PNG, JPG, JPEG, WEBP allowed' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, paymentScreenshot: 'Screenshot must be smaller than 5MB' }));
            return;
        }

        // Compress via canvas
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1000;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    const ratio = Math.min(MAX / width, MAX / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', 0.8);
                setForm(prev => ({ ...prev, paymentScreenshot: compressed }));
                setScreenshotPreview(compressed);
                setErrors(prev => ({ ...prev, paymentScreenshot: '' }));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.studentName.trim()) newErrors.studentName = 'Name is required';
        if (!form.studentEmail.trim()) newErrors.studentEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail)) newErrors.studentEmail = 'Invalid email';
        if (!form.studentPhone.trim()) newErrors.studentPhone = 'Phone is required';
        else if (!/^[6-9]\d{9}$/.test(form.studentPhone.replace(/\s/g, ''))) newErrors.studentPhone = 'Enter a valid 10-digit phone number';
        if (!form.transactionId.trim()) newErrors.transactionId = 'Transaction ID is required';
        else if (form.transactionId.trim().length < 6) newErrors.transactionId = 'Transaction ID too short';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setSubmitting(true);
            await paymentAPI.submit({
                courseId: course._id,
                ...form,
                studentPhone: form.studentPhone.replace(/\s/g, ''),
            });
            setStep('success');
            onSuccess?.();
        } catch (err: any) {
            addToast({ type: 'error', message: err?.message || 'Failed to submit payment. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={step !== 'success' ? onClose : undefined}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <QrCode className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                                        {step === 'qr' ? 'Scan & Pay' : step === 'form' ? 'Confirm Payment' : 'Payment Submitted'}
                                    </p>
                                    <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">{course.title}</h2>
                                </div>
                            </div>
                            {step !== 'success' && (
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Step indicator */}
                        {step !== 'success' && (
                            <div className="flex items-center gap-2 mt-4">
                                {['qr', 'form'].map((s, i) => (
                                    <React.Fragment key={s}>
                                        <div className={`h-1.5 flex-1 rounded-full transition-all ${step === s || (step === 'form' && i === 0) ? 'bg-white' : 'bg-white/30'}`} />
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* QR Step */}
                    {step === 'qr' && (
                        <div className="p-6">
                            {/* Course info */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{course.title}</p>
                                    <p className="text-sm text-gray-500">{course.instructor}</p>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{course.price.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* QR Code */}
                            {course.qrImage ? (
                                <div className="flex flex-col items-center mb-6">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-indigo-100 dark:border-indigo-900 mb-3">
                                        <img src={course.qrImage} alt="Payment QR Code" className="w-52 h-52 object-contain" />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" />
                                        Scan with PhonePe, GPay, Paytm, or any UPI app
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center mb-6 py-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                    <QrCode className="w-12 h-12 text-gray-400 mb-2" />
                                    <p className="text-gray-500 text-sm">QR code not configured</p>
                                </div>
                            )}

                            {/* UPI ID */}
                            {course.upiId && (
                                <div className="mb-5">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">UPI ID</p>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white">{course.upiId}</code>
                                        <button
                                            onClick={handleCopyUPI}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                                        >
                                            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Merchant Name */}
                            {course.merchantName && (
                                <div className="mb-5">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pay To</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{course.merchantName}</p>
                                </div>
                            )}

                            {/* Instructions */}
                            {course.paymentInstructions && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <div className="flex gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{course.paymentInstructions}</p>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <button
                                onClick={() => setStep('form')}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950"
                            >
                                I've Completed Payment
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="w-full mt-2 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors">
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Form Step */}
                    {step === 'form' && (
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Confirm Your Payment</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enter your payment details so we can verify your transaction.</p>
                            </div>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.studentName}
                                        onChange={e => setForm(prev => ({ ...prev, studentName: e.target.value }))}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.studentName ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors`}
                                        placeholder="Your full name"
                                    />
                                    {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={form.studentEmail}
                                        onChange={e => setForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.studentEmail ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors`}
                                        placeholder="you@example.com"
                                    />
                                    {errors.studentEmail && <p className="text-red-500 text-xs mt-1">{errors.studentEmail}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={form.studentPhone}
                                        onChange={e => setForm(prev => ({ ...prev, studentPhone: e.target.value }))}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.studentPhone ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors`}
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                    />
                                    {errors.studentPhone && <p className="text-red-500 text-xs mt-1">{errors.studentPhone}</p>}
                                </div>

                                {/* Transaction ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction ID / UTR Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.transactionId}
                                        onChange={e => setForm(prev => ({ ...prev, transactionId: e.target.value }))}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.transactionId ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'} text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono transition-colors`}
                                        placeholder="e.g. T2501031234567890"
                                    />
                                    {errors.transactionId && <p className="text-red-500 text-xs mt-1">{errors.transactionId}</p>}
                                </div>

                                {/* Screenshot Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Screenshot <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    {screenshotPreview ? (
                                        <div className="relative">
                                            <img src={screenshotPreview} alt="Payment screenshot" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                                            <button
                                                onClick={() => { setScreenshotPreview(''); setForm(prev => ({ ...prev, paymentScreenshot: '' })); }}
                                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-gray-50 dark:bg-gray-800">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload screenshot</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WEBP · Max 5MB</p>
                                            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleScreenshotUpload} />
                                        </label>
                                    )}
                                    {errors.paymentScreenshot && <p className="text-red-500 text-xs mt-1">{errors.paymentScreenshot}</p>}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none transition-colors"
                                        placeholder="Any additional information..."
                                    />
                                </div>
                            </div>

                            {/* Amount summary */}
                            <div className="mt-5 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-between">
                                <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Amount Paid</span>
                                <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">₹{course.price.toLocaleString()}</span>
                            </div>

                            {/* Buttons */}
                            <div className="mt-5 flex flex-col gap-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                    ) : (
                                        <><CheckCircle className="w-5 h-5" /> Submit Payment</>
                                    )}
                                </button>
                                <button onClick={() => setStep('qr')} className="w-full py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors">
                                    ← Back to QR
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="p-8 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                                className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-5"
                            >
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Submitted!</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                                    Your payment details have been submitted successfully. Our team will verify your transaction within <strong>24 hours</strong> and notify you once your course access is activated.
                                </p>

                                <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-left">
                                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Verification</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400">You'll receive an email & notification once approved</p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="mt-6 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-base hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PaymentModal;
