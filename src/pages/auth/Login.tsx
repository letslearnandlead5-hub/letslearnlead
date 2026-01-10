import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { slideInUp } from '../../utils/animations';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import grammarSvg from '../../assets/Grammar-correction.svg';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login, loading } = useAuthStore();
    const { addToast } = useToastStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            addToast({ type: 'success', message: 'Welcome back!' });

            // Check if user was trying to purchase a course before login
            const pendingCourseId = localStorage.getItem('pendingCourseId');
            if (pendingCourseId) {
                localStorage.removeItem('pendingCourseId');
                navigate(`/courses/${pendingCourseId}/purchase`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
            addToast({ type: 'error', message: err.message || 'Login failed' });
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
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

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

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                isLoading={loading}
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
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
