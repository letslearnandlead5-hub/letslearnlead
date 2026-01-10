import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCcw, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';

const CoursePaymentFailed: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId } = location.state || {};

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-4"
            {...pageTransition}
        >
            <Card className="max-w-lg w-full p-8 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                </motion.div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Payment Failed
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We couldn't process your payment. This could be due to insufficient funds,
                    incorrect card details, or a network issue. Please try again.
                </p>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> If the amount was deducted from your account,
                        it will be refunded within 5-7 business days.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {courseId && (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            leftIcon={<RefreshCcw className="w-5 h-5" />}
                            onClick={() => navigate(`/courses/${courseId}/purchase`)}
                        >
                            Try Again
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="w-full"
                        leftIcon={<ArrowLeft className="w-5 h-5" />}
                        onClick={() => navigate('/courses')}
                    >
                        Browse Courses
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        leftIcon={<Mail className="w-5 h-5" />}
                        onClick={() => navigate('/contact')}
                    >
                        Contact Support
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

export default CoursePaymentFailed;
