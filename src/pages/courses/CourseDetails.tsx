import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Star,
    Clock,
    Users,
    CheckCircle,
    ShoppingCart,
    BookOpen,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { pageTransition } from '../../utils/animations';
import { courseAPI } from '../../services/api';
import { formatPrice } from '../../utils/helpers';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

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
    category: string;
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
    const [enrolling, setEnrolling] = useState(false);
    const { addToast } = useToastStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (id) {
            fetchCourse();
        }
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response: any = await courseAPI.getById(id!);
            setCourse(response.data);
        } catch (error) {
            console.error('Error fetching course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            // Save course ID for redirect after login
            if (course) {
                localStorage.setItem('pendingCourseId', course._id);
            }
            addToast({
                type: 'warning',
                message: 'Please login to enroll in this course'
            });
            navigate('/login');
            return;
        }

        if (course) {
            // Check if course is free or paid
            if (course.price === 0) {
                // Free course - direct enrollment
                try {
                    setEnrolling(true);
                    await courseAPI.enroll(course._id);
                    addToast({
                        type: 'success',
                        message: 'Successfully enrolled in the course!'
                    });
                    setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
                } catch (error: any) {
                    console.error('Error enrolling in course:', error);
                    const errorMessage = error.message || error.error || 'Failed to enroll in course';
                    addToast({
                        type: 'error',
                        message: errorMessage
                    });
                } finally {
                    setEnrolling(false);
                }
            } else {
                // Paid course - redirect to purchase page
                navigate(`/courses/${course._id}/purchase`);
            }
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

    return (
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

                        {/* Price Card */}
                        <Card className="p-6 h-fit">
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl mb-4 overflow-hidden">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-primary-600">
                                        {formatPrice(course.price)}
                                    </span>
                                    {course.originalPrice && (
                                        <span className="text-lg text-gray-500 line-through">
                                            {formatPrice(course.originalPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full mb-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                leftIcon={<ShoppingCart className="w-5 h-5" />}
                                onClick={handleEnroll}
                                disabled={enrolling}
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now'}
                            </Button>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                30-Day Money-Back Guarantee
                            </p>
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
    );
};

export default CourseDetails;
