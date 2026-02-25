import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, Clock, BookOpen } from 'lucide-react';
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
    medium: 'kannada' | 'english' | 'both';
}

const CLASSES = ['All', '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard', 'PUC', 'NEET', 'Language', 'Foundation Course'];

const MEDIUM_OPTIONS = [
    { value: 'all', label: 'All Medium', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600' },
    { value: 'kannada', label: '🔵 Kannada Medium', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-400' },
    { value: 'english', label: '🟢 English Medium', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-400' },
];

const MEDIUM_BADGE: Record<string, { label: string; cls: string }> = {
    kannada: { label: '🔵 Kannada', cls: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
    english: { label: '🟢 English', cls: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
    both: { label: '🌐 Both Medium', cls: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
};

const CoursesList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedMedium, setSelectedMedium] = useState('all');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        window.scrollTo(0, 0);
        const searchQuery = searchParams.get('search');
        if (searchQuery) setSearchTerm(searchQuery);
        fetchCourses();
    }, [searchParams]);

    // Re-fetch from server whenever class or medium changes (server-side filtering)
    useEffect(() => {
        fetchCourses();
    }, [selectedClass, selectedMedium]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedClass !== 'All') params.category = selectedClass;
            if (selectedMedium !== 'all') params.medium = selectedMedium;
            const response: any = await courseAPI.getAll(params);
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side search filter only (class + medium already filtered server-side)
    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClassChange = (cls: string) => {
        setSelectedClass(cls);
        setSelectedMedium('all'); // reset medium when class changes
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Explore Courses
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Discover quality courses taught by expert instructors
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Step 1 — Class Selector */}
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                        Select Class
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {CLASSES.map((cls) => (
                            <button
                                key={cls}
                                onClick={() => handleClassChange(cls)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${selectedClass === cls
                                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'
                                    }`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2 — Medium Selector (always visible) */}
                <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                        Select Medium
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {MEDIUM_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedMedium(opt.value)}
                                className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedMedium === opt.value
                                        ? opt.value === 'kannada'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : opt.value === 'english'
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                        : `${opt.color} border-2`
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                {!loading && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                        {selectedClass !== 'All' ? ` for ${selectedClass}` : ''}
                        {selectedMedium !== 'all' ? ` · ${selectedMedium === 'kannada' ? 'Kannada' : 'English'} Medium` : ''}
                    </p>
                )}

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
                        {filteredCourses.map((course) => {
                            const badge = MEDIUM_BADGE[course.medium] || MEDIUM_BADGE['both'];
                            return (
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
                                            {/* Rating badge */}
                                            <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-semibold">{course.rating}</span>
                                            </div>
                                            {/* Medium badge */}
                                            <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold ${badge.cls}`}>
                                                {badge.label}
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
                                                    <BookOpen className="w-4 h-4 mr-1" />
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
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            No courses found matching your criteria
                        </p>
                        <button
                            onClick={() => { setSelectedClass('All'); setSelectedMedium('all'); setSearchTerm(''); }}
                            className="mt-4 text-primary-600 underline text-sm"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesList;
