import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import Confetti from 'react-confetti';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';

const CoursePaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courseId, courseName, enrollmentId } = location.state || {};
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

    useEffect(() => {
        if (!courseId) {
            navigate('/courses');
        }
    }, [courseId, navigate]);

    const handleDownloadInvoice = async () => {
        if (!enrollmentId) return;

        setDownloadingInvoice(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5000/api/invoice/enrollment/${enrollmentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice-${enrollmentId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading invoice:', error);
        } finally {
            setDownloadingInvoice(false);
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-4"
            {...pageTransition}
        >
            <Confetti
                width={typeof window !== 'undefined' ? window.innerWidth : 300}
                height={typeof window !== 'undefined' ? window.innerHeight : 200}
                recycle={false}
                numberOfPieces={500}
                gravity={0.3}
            />

            <Card className="max-w-lg w-full p-8 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                </motion.div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Payment Successful! 🎉
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                    You have successfully enrolled in
                </p>
                <p className="text-xl font-semibold text-primary-600 mb-6">
                    {courseName || 'the course'}
                </p>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        A confirmation email has been sent to your registered email address.
                        You can now access all course materials and start learning!
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        rightIcon={<ArrowRight className="w-5 h-5" />}
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to My Courses
                    </Button>
                    {enrollmentId && (
                        <Button
                            variant="outline"
                            className="w-full"
                            leftIcon={<Download className="w- 5 h-5" />}
                            onClick={handleDownloadInvoice}
                            disabled={downloadingInvoice}
                        >
                            {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
                        </Button>
                    )}
                    {courseId && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate(`/courses/${courseId}`)}
                        >
                            View Course Details
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default CoursePaymentSuccess;
