import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { slideInUp } from '../../utils/animations';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import onlineMeetingSvg from '../../assets/HR-doing-online-meeting.svg';

const SignUp: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { signup, loading } = useAuthStore();
    const { addToast } = useToastStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await signup(name, email, password);
            addToast({ type: 'success', message: 'Account created successfully!' });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
            addToast({ type: 'error', message: err.message || 'Signup failed' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 dark:from-purple-950 dark:via-blue-950 dark:to-slate-900 py-12 px-4">
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
                            src={onlineMeetingSvg}
                            alt="Online Learning"
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </motion.div>
                </motion.div>

                {/* Right Side - Signup Form */}
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
                                Create Account
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Start your learning journey today
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
                                label="Full Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                leftIcon={<UserIcon className="w-5 h-5" />}
                                required
                            />

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

                            <Input
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                leftIcon={<Lock className="w-5 h-5" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                }
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                isLoading={loading}
                                disabled={loading}
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignUp;
