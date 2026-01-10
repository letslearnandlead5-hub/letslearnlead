import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Check } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';
import { courseAPI, paymentAPI } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface Course {
    _id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    price: number;
    originalPrice?: number;
    rating: number;
    studentsEnrolled: number;
    duration: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

const CoursePurchase: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const { addToast } = useToastStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            // Save course ID and redirect to login
            localStorage.setItem('pendingCourseId', id || '');
            navigate('/login');
            return;
        }

        if (id) {
            fetchCourse();
            checkEnrollment();
        }
    }, [id, isAuthenticated]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response: any = await courseAPI.getById(id!);
            setCourse(response.data);
        } catch (error) {
            console.error('Error fetching course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const checkEnrollment = async () => {
        try {
            const response: any = await paymentAPI.checkEnrollment(id!);
            if (response.isEnrolled) {
                setIsEnrolled(true);
                toast.success('You already own this course!');
                setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
            }
        } catch (error) {
            console.error('Error checking enrollment:', error);
        }
    };

    const handleFreeEnrollment = async () => {
        if (!course) return;

        try {
            setPaying(true);

            // Call free enrollment API
            await paymentAPI.freeEnroll(course._id);

            toast.success('Successfully enrolled! 🎉');

            // Navigate to Dashboard
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);
        } catch (error: any) {
            console.error('Error enrolling in course:', error);
            toast.error(error?.response?.data?.message || 'Failed to enroll in course');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Course Not Found
                    </h1>
                    <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
                </div>
            </div>
        );
    }

    if (isEnrolled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Card className="p-8 max-w-md text-center">
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Already Enrolled!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You already own this course
                    </p>
                    <Button onClick={() => navigate('/dashboard')}>Go to My Courses</Button>
                </Card>
            </div>
        );
    }

    const discount = course.originalPrice
        ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12"
            {...pageTransition}
        >
            <div className="container mx-auto px-4">
                <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Course
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Course Summary */}
                    <div className="lg:col-span-2">
                        <Card className="p-8">
                            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                                Complete Your Purchase
                            </h1>

                            <div className="flex gap-6 mb-6">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-32 h-32 object-cover rounded-lg"
                                />
                                <div>
                                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                        {course.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        by {course.instructor}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>⭐ {course.rating}</span>
                                        <span>•</span>
                                        <span>{course.studentsEnrolled.toLocaleString()} students</span>
                                        <span>•</span>
                                        <span>{course.duration}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                    What you'll get:
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        'Full lifetime access',
                                        'Access on mobile and desktop',
                                        'Certificate of completion',
                                        'Downloadable resources',
                                        '30-day money-back guarantee',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    </div>

                    {/* Payment Card */}
                    <div>
                        <Card className="p-6 sticky top-24">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                Order Summary
                            </h3>

                            <div className="mb-6">
                                {course.originalPrice && (
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                                        <span className="text-gray-500 line-through">
                                            {formatPrice(course.originalPrice)}
                                        </span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="flex justify-between mb-2">
                                        <span className="text-green-600">Discount ({discount}%)</span>
                                        <span className="text-green-600 font-semibold">
                                            -{formatPrice(course.originalPrice! - course.price)}
                                        </span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total
                                    </span>
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatPrice(course.price)}
                                    </span>
                                </div>
                            </div>

                            {/* Free Enrollment Available */}
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-400 text-center">
                                    ✓ Free Enrollment Available
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500 text-center mt-2">
                                    Enroll now and start learning immediately
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full mb-4"
                                leftIcon={<Check className="w-5 h-5" />}
                                onClick={handleFreeEnrollment}
                                disabled={paying}
                            >
                                {paying ? 'Enrolling...' : 'Enroll Now (Free)'}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <Shield className="w-4 h-4" />
                                <span>Secure Enrollment</span>
                            </div>

                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                    Instant Access
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CoursePurchase;
