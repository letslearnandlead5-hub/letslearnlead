import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { courseAPI } from '../../services/api';
import { formatPrice } from '../../utils/helpers';

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
    level: string;
}

const CoursesList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const categories = ['All', 'School Education', 'PUC', 'Language'];

    useEffect(() => {
        window.scrollTo(0, 0);
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
        fetchCourses();
    }, [searchParams]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response: any = await courseAPI.getAll();
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Explore Courses
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Discover quality courses taught by expert instructors
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-xl transition-all ${selectedCategory === category
                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        {filteredCourses.map((course) => (
                            <motion.div key={course._id} variants={staggerItem}>
                                <Card
                                    className="cursor-pointer group h-full flex flex-col hover:shadow-2xl transition-all"
                                    onClick={() => navigate(`/courses/${course._id}`)}
                                >
                                    <div className="relative overflow-hidden rounded-xl mb-4">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-semibold">{course.rating}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {course.instructor}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 line-clamp-2">
                                            {course.description}
                                        </p>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{course.duration}</span>
                                                <span className="mx-2">•</span>
                                                <span>{course.studentsEnrolled.toLocaleString()} students</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-primary-600">
                                                        {formatPrice(course.price)}
                                                    </span>
                                                    {course.originalPrice && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                                                            {formatPrice(course.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            No courses found matching your criteria
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;
