import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Star,
    Clock,
    Users,
    CheckCircle,
    BookOpen,
    QrCode,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';
import { courseAPI, paymentAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import PaymentModal from '../../components/payment/PaymentModal';

interface Course {
    _id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    price: number;
    originalPrice?: number;
    currency?: string;
    rating: number;
    studentsEnrolled: number;
    duration: string;
    category: string;
    paymentEnabled?: boolean;
    paymentMethod?: string;
    qrImage?: string;
    upiId?: string;
    merchantName?: string;
    paymentInstructions?: string;
    sections?: Array<{
        title: string;
        description: string;
        order: number;
        subsections?: Array<{
            title: string;
            description: string;
            order: number;
            content?: Array<{
                _id: string;
                type: string;
                title: string;
                description: string;
                videoUrl?: string;
                isFree: boolean;
            }>;
        }>;
    }>;
    lessons: Array<{
        title: string;
        description: string;
        duration: string;
    }>;
}

const CourseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string>('none');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const { addToast } = useToastStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (id) {
            fetchCourse();
        }
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response: any = await courseAPI.getById(id!);
            const courseData = response.data;
            setCourse(courseData);
            // Check payment/enrollment status if user is logged in
            if (user) {
                try {
                    if (courseData?.paymentEnabled) {
                        const statusRes: any = await paymentAPI.getStatus(id!);
                        const st = statusRes.status || 'none';
                        setPaymentStatus(st);
                        if (st === 'approved') setIsEnrolled(true);
                    } else {
                        // Free course: check enrollment via enrolled courses endpoint
                        const enrolledRes: any = await courseAPI.getEnrolled();
                        const enrolled = (enrolledRes.data || []).some((c: any) => (c._id || c) === id || (c.courseId && (c.courseId._id || c.courseId) === id));
                        setIsEnrolled(enrolled);
                    }
                } catch {
                    // Could not verify enrollment
                }
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
        } finally {
            setLoading(false);
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
                    <Button onClick={() => navigate('/courses/')}>Back to Courses</Button>
                </div>
            </div>
        );
    }

    let firstLessonId = '';
    if (course?.sections) {
        for (const section of course.sections) {
            for (const subsection of section.subsections || []) {
                for (const item of subsection.content || []) {
                    if (item._id) {
                        firstLessonId = item._id;
                        break;
                    }
                }
                if (firstLessonId) break;
            }
            if (firstLessonId) break;
        }
    }

    return (<>
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950"
            {...pageTransition}
        >
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                            <p className="text-xl mb-6 text-gray-200">{course.description}</p>

                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{course.rating}</span>
                                    <span className="text-gray-300">({course.studentsEnrolled.toLocaleString()} students)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <span>Instructor: {course.instructor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Info Card */}
                        <Card className="p-6 h-fit">
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl mb-4 overflow-hidden">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Price */}
                            {course.price > 0 && (
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{course.price.toLocaleString()}</span>
                                    {course.originalPrice && course.originalPrice > course.price && (
                                        <span className="text-lg text-gray-400 line-through">₹{course.originalPrice.toLocaleString()}</span>
                                    )}
                                </div>
                            )}

                            {/* CTA based on state */}
                            {isEnrolled ? (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => {
                                        if (firstLessonId) {
                                            navigate(`/video/${id}/${firstLessonId}/`);
                                        } else {
                                            addToast({ type: 'warning', message: 'No lessons are available for this course yet.' });
                                        }
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Go to Course
                                </Button>
                            ) : course.paymentEnabled ? (
                                <div className="space-y-3">
                                    {paymentStatus === 'pending' ? (
                                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
                                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Payment Pending Verification</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Our team will verify within 24 hours</p>
                                        </div>
                                    ) : paymentStatus === 'rejected' ? (
                                        <>
                                            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center mb-2">
                                                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Previous Payment Rejected</p>
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Please try again with correct details</p>
                                            </div>
                                            <button
                                                onClick={() => user ? setShowPaymentModal(true) : navigate('/login/')}
                                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                            >
                                                <QrCode className="w-5 h-5" />
                                                Try Again
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => user ? setShowPaymentModal(true) : navigate('/login/')}
                                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 text-base"
                                        >
                                            <QrCode className="w-5 h-5" />
                                            Buy Now — ₹{course.price.toLocaleString()}
                                        </button>
                                    )}
                                    {!user && (
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                            <button onClick={() => navigate('/login/')} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Login</button> to purchase this course
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                        📚 Want to access this course?
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Contact your administrator to get enrolled in this course.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">What You'll Learn</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    'Master core concepts and fundamentals',
                                    'Build real-world projects from scratch',
                                    'Best practices and industry standards',
                                    'Advanced techniques and optimizations',
                                ].map((item, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Course Content */}
                        {course.lessons && course.lessons.length > 0 && (
                            <Card className="p-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                    <BookOpen className="w-6 h-6" />
                                    Course Content
                                </h2>
                                <div className="space-y-3">
                                    {course.lessons.map((lesson, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {index + 1}. {lesson.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {lesson.description}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-gray-500">{lesson.duration}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div>
                        <Card className="p-6">
                            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">This course includes:</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{course.duration} of video content</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Downloadable resources</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Lifetime access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Certificate of completion</span>
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Payment Modal */}
        {course && showPaymentModal && (
            <PaymentModal
                course={course}
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    setPaymentStatus('pending');
                    setShowPaymentModal(false);
                }}
            />
        )}
    </>);
};

export default CourseDetails;
