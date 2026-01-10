import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Users,
    Award,
    Video,
    ArrowRight,
    Phone,
    Sparkles,
    Star,
    Rocket,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SubjectCarousel from '../components/SubjectCarousel';
import { staggerContainer, staggerItem } from '../utils/animations';
import { courseAPI, statsAPI } from '../services/api';
import contactSupport from '../assets/contact-support.png';
import classroomSvg from '../assets/Classroom.svg';
import teachingSvg from '../assets/Teaching.svg';

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
}

interface Stats {
    totalStudents: number;
    totalCourses: number;
    successRate: number;
}

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalStudents: 0,
        totalCourses: 0,
        successRate: 100,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
        fetchStats();
    }, []);

    const fetchCourses = async () => {
        try {
            const response: any = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response: any = await statsAPI.getPublicStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const features = [
        {
            icon: Video,
            title: 'High quality video classes',
            color: 'bg-red-100 dark:bg-red-900',
            iconColor: 'text-red-600 dark:text-red-400',
        },
        {
            icon: BookOpen,
            title: 'Free notes & materials',
            color: 'bg-blue-100 dark:bg-blue-900',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            icon: Users,
            title: 'Expert teachers',
            color: 'bg-green-100 dark:bg-green-900',
            iconColor: 'text-green-600 dark:text-green-400',
        },
        {
            icon: Award,
            title: 'Concept building learning',
            color: 'bg-purple-100 dark:bg-purple-900',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
    ];



    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <section
                className="relative min-h-screen py-20 overflow-hidden flex items-center"
            >
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-blue-900/60 to-pink-900/70 dark:from-gray-900/80 dark:via-purple-900/70 dark:to-blue-900/80" />
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 5, 0]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 left-10 text-purple-400/30 dark:text-purple-400/20"
                    >
                        <Sparkles size={48} />
                    </motion.div>
                    <motion.div
                        animate={{
                            y: [0, 20, 0],
                            rotate: [0, -5, 0]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute top-40 right-20 text-blue-400/30 dark:text-blue-400/20"
                    >
                        <Star size={40} />
                    </motion.div>
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            x: [0, 10, 0]
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-20 left-1/4 text-pink-400/30 dark:text-pink-400/20"
                    >
                        <Rocket size={36} />
                    </motion.div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
                        {/* Left Side - Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-left z-10"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                                    Building the{' '}
                                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                                        Leaders
                                    </span>
                                    {' '}of Tomorrow
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="text-xl text-white/90 mb-8"
                            >
                                Learn today, lead tomorrow - your future starts here
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="flex flex-wrap gap-4"
                            >
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => navigate('/signup')}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    Join Now
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => navigate('/notes')}
                                    className="border-2 border-white/80 text-white hover:bg-white hover:text-purple-700 transition-all transform hover:scale-105"
                                >
                                    Try Free Notes
                                </Button>
                            </motion.div>

                            {/* Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="mt-12 grid grid-cols-3 gap-8"
                            >
                                <div className="text-left">
                                    <div className="text-3xl md:text-4xl font-bold text-white">
                                        {stats.totalStudents >= 1000 
                                            ? `${Math.floor(stats.totalStudents / 1000)}K+` 
                                            : `${stats.totalStudents}+`}
                                    </div>
                                    <div className="text-sm text-white/80 mt-1">
                                        Students
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-3xl md:text-4xl font-bold text-white">
                                        {stats.totalCourses}+
                                    </div>
                                    <div className="text-sm text-white/80 mt-1">
                                        Courses
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-3xl md:text-4xl font-bold text-white">
                                        {stats.successRate}%
                                    </div>
                                    <div className="text-sm text-white/80 mt-1">
                                        Success
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Side - Classroom Illustration */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative hidden md:flex justify-center items-center"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -15, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10 w-full max-w-lg"
                            >
                                <img
                                    src={classroomSvg}
                                    alt="Online Learning Classroom"
                                    className="w-full h-auto drop-shadow-2xl"
                                />
                            </motion.div>

                            {/* Decorative Glow Behind SVG */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.5, 0.3]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section
                className="relative min-h-screen py-20 overflow-hidden flex items-center bg-white dark:bg-slate-800"
            >

                {/* Animated Floating Orbs */}
                <motion.div
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 20, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        x: [0, -20, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"
                />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Why Choose{' '}
                            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                                Us?
                            </span>
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                            Discover what makes our learning platform exceptional
                        </p>
                    </motion.div>

                    {/* Feature Cards Grid */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={staggerItem}
                                whileHover={{
                                    y: -10,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <Card className="relative text-center p-8 h-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 group overflow-hidden">
                                    {/* Card Glow Effect on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-pink-500/10 transition-all duration-500" />

                                    {/* Animated Icon Container */}
                                    <motion.div
                                        className={`relative w-20 h-20 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                                        whileHover={{
                                            rotate: [0, -10, 10, -10, 0],
                                            scale: 1.1
                                        }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />

                                        {/* Icon Pulse Effect */}
                                        <motion.div
                                            className={`absolute inset-0 ${feature.color} rounded-2xl`}
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0.5, 0, 0.5]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: index * 0.2
                                            }}
                                        />
                                    </motion.div>

                                    <h3 className="relative font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {feature.title}
                                    </h3>

                                    {/* Decorative Dot Pattern */}
                                    <div className="absolute top-2 right-2 w-16 h-16 opacity-10 dark:opacity-5">
                                        <svg viewBox="0 0 40 40" fill="currentColor" className="text-purple-600">
                                            <circle cx="5" cy="5" r="2" />
                                            <circle cx="15" cy="5" r="2" />
                                            <circle cx="25" cy="5" r="2" />
                                            <circle cx="35" cy="5" r="2" />
                                            <circle cx="5" cy="15" r="2" />
                                            <circle cx="15" cy="15" r="2" />
                                            <circle cx="25" cy="15" r="2" />
                                            <circle cx="35" cy="15" r="2" />
                                        </svg>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Courses We Offer Section */}
            <section
                className="relative min-h-screen py-20 overflow-hidden flex items-center courses-section"
            >

                {/* Animated Floating Shapes */}
                <motion.div
                    animate={{
                        y: [0, -40, 0],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 left-1/4 w-24 h-24 border-4 border-blue-400/20 dark:border-blue-400/10 rounded-lg"
                />
                <motion.div
                    animate={{
                        y: [0, 40, 0],
                        rotate: [0, -180, -360]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-20 right-1/4 w-32 h-32 border-4 border-purple-400/20 dark:border-purple-400/10 rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 right-10 w-20 h-20 bg-gradient-to-br from-pink-400/30 to-orange-400/30 dark:from-pink-400/20 dark:to-orange-400/20 rounded-2xl blur-xl"
                />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Enhanced Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Courses We{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Offer
                            </span>
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                            Explore our comprehensive range of courses designed to help you excel
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            variants={staggerContainer}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                        >
                            {courses.map((course) => (
                                <motion.div
                                    key={course._id}
                                    variants={staggerItem}
                                    whileHover={{
                                        y: -15,
                                        transition: { duration: 0.3 }
                                    }}
                                >
                                    <Card className="relative overflow-hidden h-full flex flex-col backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-2 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group">
                                        {/* Card Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                        {/* Course Thumbnail */}
                                        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {/* Overlay on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        {/* Course Content */}
                                        <div className="p-6 flex flex-col flex-1 relative">
                                            <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white min-h-[3.5rem] line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
                                                {course.description}
                                            </p>

                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => navigate(`/courses/${course._id}`)}
                                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform group-hover:scale-105 mt-auto"
                                            >
                                                View Course
                                            </Button>
                                        </div>

                                        {/* Corner Decoration */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent dark:from-blue-400/10 rounded-bl-full" />
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* View All Button */}
                    <motion.div
                        className="text-center mt-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/courses')}
                            rightIcon={<ArrowRight className="w-5 h-5" />}
                            className="border-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 hover:text-white dark:hover:text-white hover:border-transparent transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            View All Courses
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Popular Subjects Section */}
            <section
                className="relative min-h-screen py-20 overflow-hidden flex items-center subjects-section"
            >

                {/* Animated Floating Elements */}
                <motion.div
                    animate={{
                        y: [0, -25, 0],
                        x: [0, 15, 0],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-32 right-20 w-16 h-16 border-3 border-green-400/30 dark:border-green-400/20 rounded-lg"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-32 left-20 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 dark:from-cyan-400/10 dark:to-blue-400/10 rounded-full blur-2xl"
                />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Header with Illustration */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                        {/* Left Side - Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-left"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Popular{' '}
                                <span className="bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Subjects
                                </span>
                            </h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                Explore our most in-demand subjects taught by expert educators. From mathematics to science, we cover all the essential topics to help you excel in your studies.
                            </p>
                        </motion.div>

                        {/* Right Side - Teaching Illustration */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="flex justify-center items-center"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -12, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full max-w-md"
                            >
                                <img
                                    src={teachingSvg}
                                    alt="Teaching Illustration"
                                    className="w-full h-auto drop-shadow-2xl"
                                />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Subject Carousel/Grid */}
                    <SubjectCarousel />

                </div>
            </section>

            {/* Contact Us Section */}
            <section
                className="relative py-20 overflow-hidden contact-section"
            >
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Contact Us
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Have questions? We're here to help you on your learning journey
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Left Side - Support Illustration */}
                            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex justify-center items-center">
                                <img src={contactSupport} alt="Customer Support" className="w-full max-w-md h-auto" />
                            </motion.div>

                            {/* Right Side - WhatsApp Contact Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="group"
                            >
                                <Card className="p-8 text-center hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <Phone className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        WhatsApp Support
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Get instant responses to your queries
                                    </p>
                                    <a
                                        href="https://wa.me/919916312101"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block"
                                    >
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Phone className="w-5 h-5 mr-2" />
                                            9916312101
                                        </Button>
                                    </a>
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        Available 24/7 for support
                                    </p>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
