import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, BookOpen, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
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
    medium: 'kannada' | 'english';
    grade?: string;
}

const CATEGORIES = [
    { value: 'all', label: 'All Subjects', icon: '📚' },
    { value: 'science', label: 'Science', icon: '🔬' },
    { value: 'math', label: 'Mathematics', icon: '📐' },
    { value: 'english', label: 'English', icon: '📖' },
    { value: 'kannada', label: 'Kannada', icon: '🗣️' },
    { value: 'social', label: 'Social Studies', icon: '🌍' },
    { value: 'computer', label: 'Computer Science', icon: '💻' },
    { value: 'physics', label: 'Physics', icon: '⚛️' },
    { value: 'chemistry', label: 'Chemistry', icon: '🧪' },
    { value: 'biology', label: 'Biology', icon: '🧬' },
    { value: 'history', label: 'History', icon: '📜' },
];

const GRADES = [
    { value: 'All', label: 'All Grades' },
    { value: '6th', label: '6th Std' },
    { value: '7th', label: '7th Std' },
    { value: '8th', label: '8th Std' },
    { value: '9th', label: '9th Std' },
    { value: '10th', label: '10th Std' },
    { value: '11th', label: '11th Std' },
    { value: '12th', label: '12th Std' },
];

const MEDIUM_OPTIONS = [
    { value: 'all', label: '🌐 All Medium', color: 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-400' },
    { value: 'kannada', label: '🔵 Kannada Medium', color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-400' },
    { value: 'english', label: '🟢 English Medium', color: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-400' },
];



const CoursesList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedMedium, setSelectedMedium] = useState('all');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        subject: true,
        grade: true,
        medium: true,
    });
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const toggleSection = (section: 'subject' | 'grade' | 'medium') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const fetchCourses = async (category: string, grade: string, med: string) => {
        try {
            setLoading(true);
            console.log('🔄 Fetching courses with:', { category, grade, medium: med });
            const params: any = {};
            if (category !== 'all') params.category = category;
            if (grade !== 'All') params.grade = grade;
            if (med !== 'all') params.medium = med;
            console.log('📤 API params:', params);
            
            // Add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            try {
                const response: any = await courseAPI.getAll(params);
                clearTimeout(timeoutId);
                console.log('📥 API response:', response);
                setCourses(response.data || []);
            } catch (apiError: any) {
                clearTimeout(timeoutId);
                if (apiError.name === 'AbortError') {
                    console.error('❌ Request timeout after 10 seconds');
                    throw new Error('Request timeout - please try again');
                }
                throw apiError;
            }
        } catch (error: any) {
            console.error('❌ Error fetching courses:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.status
            });
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const searchQuery = searchParams.get('search');
        if (searchQuery) setSearchTerm(searchQuery);
    }, []);

    // Fetch courses only when category, grade, or medium changes
    useEffect(() => {
        fetchCourses(selectedCategory, selectedGrade, selectedMedium);
    }, [selectedCategory, selectedGrade, selectedMedium]);

    // Client-side search filter only (category + grade + medium already filtered server-side)
    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get active filters for chips
    const activeFilters: Array<{ type: string; value: string; label: string }> = [];
    if (selectedCategory !== 'all') {
        const cat = CATEGORIES.find(c => c.value === selectedCategory);
        if (cat) activeFilters.push({ type: 'category', value: selectedCategory, label: cat.label });
    }
    if (selectedGrade !== 'All') {
        const grade = GRADES.find(g => g.value === selectedGrade);
        if (grade) activeFilters.push({ type: 'grade', value: selectedGrade, label: grade.label });
    }
    if (selectedMedium !== 'all') {
        const medium = MEDIUM_OPTIONS.find(m => m.value === selectedMedium);
        if (medium) activeFilters.push({ type: 'medium', value: selectedMedium, label: medium.label });
    }

    const removeFilter = (type: string) => {
        if (type === 'category') setSelectedCategory('all');
        if (type === 'grade') setSelectedGrade('All');
        if (type === 'medium') setSelectedMedium('all');
    };

    const clearAllFilters = () => {
        setSelectedCategory('all');
        setSelectedGrade('All');
        setSelectedMedium('all');
        setSearchTerm('');
    };

    // Filter Sidebar Component
    const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={`${isMobile ? 'p-6' : 'sticky top-4'}`}>
            {isMobile && (
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                    <button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Subject Filter */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('subject')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Subject
                    </h3>
                    {expandedSections.subject ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.subject && (
                    <div className="space-y-2">
                        {CATEGORIES.map((cat) => (
                            <label
                                key={cat.value}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    checked={selectedCategory === cat.value}
                                    onChange={() => setSelectedCategory(cat.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                    {cat.icon} {cat.label}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Grade Filter */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => toggleSection('grade')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Grade / Standard
                    </h3>
                    {expandedSections.grade ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.grade && (
                    <div className="space-y-2">
                        {GRADES.map((grade) => (
                            <label
                                key={grade.value}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                            >
                                <input
                                    type="radio"
                                    name="grade"
                                    checked={selectedGrade === grade.value}
                                    onChange={() => setSelectedGrade(grade.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                    {grade.label}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Medium Filter */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('medium')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Medium
                    </h3>
                    {expandedSections.medium ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>
                {expandedSections.medium && (
                    <div className="space-y-2">
                        {MEDIUM_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
                            >
                                <input
                                    type="radio"
                                    name="medium"
                                    checked={selectedMedium === opt.value}
                                    onChange={() => setSelectedMedium(opt.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear All Button */}
            {activeFilters.length > 0 && (
                <button
                    onClick={clearAllFilters}
                    className="w-full py-2 px-4 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Explore Courses
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Discover quality courses taught by expert instructors
                    </p>
                </div>

                {/* Search Bar */}
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

                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-4">
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium hover:border-primary-500 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFilters.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                                {activeFilters.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <FilterSidebar />
                        </div>
                    </aside>

                    {/* Course List */}
                    <div className="flex-1 min-w-0">
                        {/* Active Filter Chips */}
                        {activeFilters.length > 0 && (
                            <div className="mb-6 flex flex-wrap gap-2 items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Active filters:
                                </span>
                                {activeFilters.map((filter) => (
                                    <motion.div
                                        key={filter.type}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium"
                                    >
                                        <span>{filter.label}</span>
                                        <button
                                            onClick={() => removeFilter(filter.type)}
                                            className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Results Count */}
                        {!loading && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
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
                                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
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
                                                {/* Rating badge */}
                                                <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-semibold">{course.rating}</span>
                                                </div>
                                                {/* Grade Badge */}
                                                {course.grade && (
                                                    <div className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                                        {course.grade} Std
                                                    </div>
                                                )}
                                                {/* Medium Badge */}
                                                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                                                    {course.medium === 'kannada' ? '🔵 Kannada' : '🟢 English'}
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
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📚</div>
                                <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">
                                    No courses found
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                                    Try adjusting your filters or search terms
                                </p>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-primary-600 hover:text-primary-700 font-medium underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 overflow-y-auto lg:hidden"
                        >
                            <FilterSidebar isMobile />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoursesList;
