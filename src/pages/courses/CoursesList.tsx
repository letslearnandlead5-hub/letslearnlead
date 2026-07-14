import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, BookOpen, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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

// Mapped tabs for categories and grades in alignment with CourseEditor model
const FILTER_TABS = [
    { value: 'all',          label: 'All Courses',        icon: '📚', type: 'all' },
    { value: '6th',          label: '6th Standard',       icon: '6️⃣', type: 'grade' },
    { value: '7th',          label: '7th Standard',       icon: '7️⃣', type: 'grade' },
    { value: '8th',          label: '8th Standard',       icon: '8️⃣', type: 'grade' },
    { value: '9th',          label: '9th Standard',       icon: '9️⃣', type: 'grade' },
    { value: '10th',         label: '10th Standard',      icon: '🔟', type: 'grade' },
    { value: 'school-puc',   label: 'PUC (11th/12th)',    icon: '🎓', type: 'category' },
    { value: 'neet',         label: 'NEET',               icon: '🩺', type: 'category' },
    { value: 'jee',          label: 'JEE',                icon: '⚙️', type: 'category' },
    { value: 'kcet',         label: 'KCET',               icon: '📋', type: 'category' },
    { value: 'competitive',  label: 'Govt / Comp Exams',  icon: '🏛️', type: 'category' },
];

const CoursesList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedMedium, setSelectedMedium] = useState('all');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const handleContainerScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = 240;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        // Run scroll check after initial mount & layout
        const timer = setTimeout(() => {
            handleScroll();
        }, 100);
        
        const el = scrollContainerRef.current;
        if (el) {
            el.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            clearTimeout(timer);
            if (el) {
                el.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('resize', handleScroll);
        };
    }, [courses]);

    const fetchCourses = async (categoryVal: string, med: string, search: string) => {
        try {
            setLoading(true);
            const params: any = {};
            
            const tab = FILTER_TABS.find(t => t.value === categoryVal) || FILTER_TABS[0];
            if (tab.type === 'category') {
                params.category = tab.value;
            } else if (tab.type === 'grade') {
                params.grade = tab.value;
            }
            
            if (med !== 'all') params.medium = med;
            if (search.trim()) params.search = search.trim();
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response: any = await courseAPI.getAll(params);
                clearTimeout(timeoutId);
                setCourses(response.data || []);
            } catch (apiError: any) {
                clearTimeout(timeoutId);
                if (apiError.name === 'AbortError') {
                    throw new Error('Request timeout - please try again');
                }
                throw apiError;
            }
        } catch (error: any) {
            console.error('❌ Error fetching courses:', error);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
            setSearchTerm(searchQuery);
            fetchCourses(selectedCategory, selectedMedium, searchQuery);
        } else {
            fetchCourses(selectedCategory, selectedMedium, '');
        }
    }, []);

    // Re-fetch when category or medium changes (immediately)
    useEffect(() => {
        fetchCourses(selectedCategory, selectedMedium, searchTerm);
    }, [selectedCategory, selectedMedium]);

    // Debounced re-fetch when search text changes (wait 400ms after user stops typing)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchCourses(selectedCategory, selectedMedium, searchTerm);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);

    // courses is already filtered server-side; no client-side filter needed
    const filteredCourses = courses;

    const activeFilters: Array<{ type: string; value: string; label: string }> = [];
    if (selectedCategory !== 'all') {
        const cat = FILTER_TABS.find(c => c.value === selectedCategory);
        if (cat) activeFilters.push({ type: 'category', value: selectedCategory, label: `${cat.icon} ${cat.label}` });
    }
    if (selectedMedium !== 'all') {
        const medLabel = selectedMedium === 'kannada' ? '🔵 Kannada Medium' : selectedMedium === 'english' ? '🟢 English Medium' : '🌐 Both';
        activeFilters.push({ type: 'medium', value: selectedMedium, label: medLabel });
    }

    const removeFilter = (type: string) => {
        if (type === 'category') setSelectedCategory('all');
        if (type === 'medium') setSelectedMedium('all');
    };

    const clearAllFilters = () => {
        setSelectedCategory('all');
        setSelectedMedium('all');
        setSearchTerm('');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header section with modern dark overlay gradient */}
            <div className="bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20 py-8 border-b border-gray-200/50 dark:border-gray-800/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Explore Courses
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base font-medium">
                            Discover quality courses taught by expert instructors. Learn, earn, and lead.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search and Filters Selection Bar */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mb-6">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses by name or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Only Medium dropdown remains — Grade was removed because
                        courses store grade info inside the category field (e.g. '8th Standard') */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Medium Dropdown */}
                        <div className="relative sm:w-56">
                            <select
                                value={selectedMedium}
                                onChange={(e) => setSelectedMedium(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer text-sm"
                            >
                                <option value="all">🌐 All Mediums</option>
                                <option value="kannada">🔵 Kannada Medium</option>
                                <option value="english">🟢 English Medium</option>
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Horizontal Category Scrollable List */}
                <div className="mb-6 relative group/scroll">
                    {/* Left Scroll Arrow */}
                    {showLeftArrow && (
                        <button
                            type="button"
                            onClick={() => handleContainerScroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div 
                        ref={scrollContainerRef}
                        className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {FILTER_TABS.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 border transition-all shrink-0 snap-start select-none ${
                                    selectedCategory === cat.value
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20 scale-[1.02]'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                }`}
                            >
                                <span className="text-base select-none">{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Scroll Arrow */}
                    {showRightArrow && (
                        <button
                            type="button"
                            onClick={() => handleContainerScroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                    {/* Visual fade effect indicators for overflow */}
                    <div className="hidden lg:block absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-950 pointer-events-none" />
                </div>

                {/* Active Filter Chips */}
                {activeFilters.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2 items-center bg-white dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">
                            Active Filters:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {activeFilters.map((filter) => (
                                <span
                                    key={filter.type}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-bold border border-primary-200/50 dark:border-primary-900/50"
                                >
                                    <span>{filter.label}</span>
                                    <button
                                        onClick={() => removeFilter(filter.type)}
                                        className="hover:bg-primary-100 dark:hover:bg-primary-900 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={clearAllFilters}
                            className="text-xs font-extrabold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors ml-auto pl-2"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* Course List Layout grid */}
                <div className="min-w-0">
                    {/* Results Count Info */}
                    {!loading && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-semibold">
                            Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} for your selection
                        </p>
                    )}

                    {/* Courses Grid */}
                    {loading ? (
                        <div className="text-center py-24 flex flex-col items-center">
                            <RefreshCw className="animate-spin text-primary-600 w-10 h-10 mb-4" />
                            <p className="text-gray-650 dark:text-gray-400 font-medium">Updating course list...</p>
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <motion.div
                            className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {filteredCourses.map((course) => (
                                <motion.div key={course._id} variants={staggerItem}>
                                    <Card
                                        className="cursor-pointer group h-full flex flex-col hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden"
                                        onClick={() => navigate(`/courses/${course._id}/`)}
                                    >
                                        <div className="relative overflow-hidden aspect-video">
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* Rating badge */}
                                            <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{course.rating}</span>
                                            </div>
                                            {/* Grade Badge */}
                                            {course.grade && (
                                                <div className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-md">
                                                    {course.grade} Std
                                                </div>
                                            )}
                                            {/* Medium Badge */}
                                            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur text-white px-2.5 py-1 rounded-xl text-xs font-bold">
                                                {course.medium === 'kannada' ? '🔵 Kannada' : '🟢 English'}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col p-5">
                                            <h3 className="font-bold text-base mb-1.5 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                                                By {course.instructor}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                                                {course.description}
                                            </p>

                                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-4">
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                    <span>{course.duration}</span>
                                                    <span className="mx-2 text-gray-300">•</span>
                                                    <BookOpen className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                                    <span>{course.studentsEnrolled.toLocaleString()} students</span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                            {course.price === 0 ? 'Free' : formatPrice(course.price)}
                                                        </span>
                                                        {course.originalPrice && (
                                                            <span className="text-xs text-gray-400 line-through ml-2">
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
                        <div className="text-center py-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
                            <div className="text-5xl mb-4 select-none">🔍</div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                No courses found
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Try adjusting your keywords, grade selection, or subject categories.
                            </p>
                            <button
                                onClick={clearAllFilters}
                                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary-500/10"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursesList;
