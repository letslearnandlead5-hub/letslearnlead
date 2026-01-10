import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const getPasswordStrength = (): { text: string; color: string } => {
        if (password.length === 0) return { text: '', color: '' };
        if (password.length < 6) return { text: 'Too short', color: 'text-red-500' };
        if (password.length < 8) return { text: 'Weak', color: 'text-orange-500' };
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return { text: 'Medium', color: 'text-yellow-500' };
        }
        return { text: 'Strong', color: 'text-green-500' };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                password,
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/auth/login');
            }, 3000);
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to reset password. The link may have expired.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Password Reset Successful!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Your password has been successfully updated.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting to login page...
                        </p>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Enter your new password below
                        </p>
                    </div>

                    <form on-Submit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password"
                                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {password && (
                                <p className={`text-sm mt-1 ${getPasswordStrength().color}`}>
                                    {getPasswordStrength().text}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm new password"
                                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-sm mt-1 text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-600 dark:text-blue-400">
                            <strong>Password requirements:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>At least 6 characters</li>
                                <li>Recommended: Include uppercase, numbers, and symbols</li>
                            </ul>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading || !token}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
