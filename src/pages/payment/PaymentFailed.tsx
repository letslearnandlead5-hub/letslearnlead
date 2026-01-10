import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RotateCcw, Home, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PaymentFailed: React.FC = () => {
    const navigate = useNavigate();

    const errorReasons = [
        'Insufficient funds in your account',
        'Card details verification failed',
        'Transaction declined by your bank',
        'Network connectivity issues',
    ];

    const randomReason = errorReasons[Math.floor(Math.random() * errorReasons.length)];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12">
            <motion.div
                className="container max-w-2xl mx-auto px-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="p-8 text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mb-6"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-20 h-20 text-white" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1 className="text-4xl font-bold text-red-600 mb-4">
                            Payment Failed
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                            We couldn't process your payment
                        </p>

                        <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div className="text-left">
                                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                        Transaction Error
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {randomReason}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-left mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <h3 className="font-semibold mb-3">What you can do:</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>Check your card details and try again</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>Ensure you have sufficient balance</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>Contact your bank if the issue persists</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary-600 mt-1">•</span>
                                    <span>Try using a different payment method</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-1"
                                onClick={() => navigate('/payment')}
                                leftIcon={<RotateCcw className="w-5 h-5" />}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={() => navigate('/')}
                                leftIcon={<Home className="w-5 h-5" />}
                            >
                                Go Home
                            </Button>
                        </div>

                        <p className="text-sm text-gray-500 mt-6">
                            Need help? Contact us at <a href="mailto:support@edu.com" className="text-primary-600 hover:underline">support@edu.com</a>
                        </p>
                    </motion.div>
                </Card>
            </motion.div>
        </div>
    );
};

export default PaymentFailed;
