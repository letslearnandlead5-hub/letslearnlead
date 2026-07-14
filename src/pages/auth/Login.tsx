import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, MonitorSmartphone } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { slideInUp } from '../../utils/animations';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import grammarSvg from '../../assets/Grammar-correction.svg';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isBlockedElsewhere, setIsBlockedElsewhere] = useState(false);

    const navigate = useNavigate();
    const { login, loading, isAuthenticated } = useAuthStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsBlockedElsewhere(false);

        try {
            await login(email, password);
            addToast({ type: 'success', message: 'Welcome back!' });

            // Check if user was trying to purchase a course before login
            const pendingCourseId = localStorage.getItem('pendingCourseId');
            if (pendingCourseId) {
                localStorage.removeItem('pendingCourseId');
                navigate(`/courses/${pendingCourseId}/purchase/`);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            // Handle Single Device Login block mode specifically
            if (err?.code === 'ACCOUNT_ACTIVE_ELSEWHERE') {
                setIsBlockedElsewhere(true);
                setError(err.message || 'This account is already active on another device.');
            } else {
                setError(err?.message || 'Login failed. Please try again.');
                addToast({ type: 'error', message: err?.message || 'Login failed' });
            }
        }
    };

    const handleForceLogin = async () => {
        setError('');
        try {
            await login(email, password, true);
            addToast({ type: 'success', message: 'Welcome back! Logged out from other device.' });
            const pendingCourseId = localStorage.getItem('pendingCourseId');
            if (pendingCourseId) {
                localStorage.removeItem('pendingCourseId');
                navigate(`/courses/${pendingCourseId}/purchase/`);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err?.message || 'Login failed. Please try again.');
            addToast({ type: 'error', message: err?.message || 'Login failed' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 py-12 px-4">
            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
                {/* Left Side - Illustration */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hidden md:flex justify-center items-center"
                >
                    <motion.div
                        animate={{
                            y: [0, -15, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full max-w-lg"
                    >
                        <img
                            src={grammarSvg}
                            alt="Learning Illustration"
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </motion.div>
                </motion.div>

                {/* Right Side - Login Form */}
                <motion.div
                    className="w-full"
                    variants={slideInUp}
                    initial="initial"
                    animate="animate"
                >
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Sign in to continue your learning
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                                isBlockedElsewhere
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            }`}>
                                {isBlockedElsewhere ? (
                                    <MonitorSmartphone className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                    <p className={`text-sm font-medium ${
                                        isBlockedElsewhere
                                            ? 'text-amber-800 dark:text-amber-200'
                                            : 'text-red-800 dark:text-red-200'
                                    }`}>
                                        {isBlockedElsewhere ? 'Account Active Elsewhere' : 'Login Failed'}
                                    </p>
                                    <p className={`text-sm mt-0.5 ${
                                        isBlockedElsewhere
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-red-700 dark:text-red-300'
                                    }`}>
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Google Sign In */}
                        <GoogleSignInButton onSignIn={() => { }} />

                        {/* Divider */}
                        <div className="relative flex items-center my-6">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">
                                Or continue with email
                            </span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<Mail className="w-5 h-5" />}
                                required
                            />

                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<Lock className="w-5 h-5" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                }
                                required
                            />

                            <div className="flex justify-end">
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {isBlockedElsewhere ? (
                                <button
                                    type="button"
                                    onClick={handleForceLogin}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-amber-200 dark:shadow-orange-950"
                                    disabled={loading}
                                >
                                    Logout Other Device & Sign In Here
                                </button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                    isLoading={loading}
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            )}
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
