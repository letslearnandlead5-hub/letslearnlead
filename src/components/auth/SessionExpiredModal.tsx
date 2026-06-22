import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogIn, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const SessionExpiredModal: React.FC = () => {
    const { sessionExpired, sessionExpiredReason, clearSessionExpiry } = useAuthStore();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(6);

    // Auto-redirect countdown when modal is visible
    useEffect(() => {
        if (!sessionExpired) return;

        setCountdown(6);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleLogin();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionExpired]);

    const handleLogin = () => {
        clearSessionExpiry();
        navigate('/login/', { replace: true });
    };

    return (
        <AnimatePresence>
            {sessionExpired && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="session-expired-title"
                        aria-describedby="session-expired-desc"
                    >
                        <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

                            {/* Top gradient bar */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-400" />

                            {/* Progress bar (countdown visual) */}
                            <motion.div
                                className="h-0.5 bg-red-500 origin-left"
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 6, ease: 'linear' }}
                            />

                            <div className="p-8">
                                {/* Icon */}
                                <div className="flex justify-center mb-5">
                                    <motion.div
                                        initial={{ rotate: -10 }}
                                        animate={{ rotate: [-10, 10, -10, 10, 0] }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                                    >
                                        <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
                                    </motion.div>
                                </div>

                                {/* Text */}
                                <div className="text-center mb-6">
                                    <h2
                                        id="session-expired-title"
                                        className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                                    >
                                        Session Ended
                                    </h2>
                                    <p
                                        id="session-expired-desc"
                                        className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                                    >
                                        {sessionExpiredReason}
                                    </p>
                                </div>

                                {/* Countdown */}
                                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        Redirecting to login in{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                                            {countdown}s
                                        </span>
                                    </span>
                                </div>

                                {/* CTA Button */}
                                <button
                                    id="session-expired-login-btn"
                                    onClick={handleLogin}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Log In Again
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SessionExpiredModal;
