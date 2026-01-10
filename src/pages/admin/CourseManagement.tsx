import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, BookOpen, Users, Clock, DollarSign, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
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
    status: string;
    createdAt: string;
}

const CourseManagement: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');

    const { addToast } = useToastStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, [searchTerm, selectedCategory, selectedLevel]);

    const fetchCourses = async () => {
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (selectedLevel !== 'all') params.level = selectedLevel;

            const response = await courseAPI.getAll(params);
            setCourses(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            addToast({ type: 'error', message: 'Failed to load courses' });
            setLoading(false);
        }
    };

    const handleViewCourse = (course: Course) => {
        setSelectedCourse(course);
        setIsViewerOpen(true);
    };

    const handleCreateCourse = () => {
        navigate('/admin/courses/new');
    };

    const handleEditCourse = (course: Course) => {
        navigate(`/admin/courses/edit/${course._id}`);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

        try {
            await courseAPI.delete(courseId);
            addToast({ type: 'success', message: 'Course deleted successfully!' });
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            addToast({ type: 'error', message: 'Failed to delete course' });
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedLevel('all');
    };

    const activeFiltersCount =
        (searchTerm ? 1 : 0) +
        (selectedCategory !== 'all' ? 1 : 0) +
        (selectedLevel !== 'all' ? 1 : 0);

    const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
    // Note: studentsEnrolled is not tracked yet - these will show 0 until enrollment system is implemented
    const totalRevenue = courses.reduce((sum, course) => sum + (course.price * (course.studentsEnrolled || 0)), 0);
    const totalStudents = courses.reduce((sum, course) => sum + (course.studentsEnrolled || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create and manage courses for students
                    </p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={handleCreateCourse}
                >
                    Add New Course
                </Button>
            </div>

            {/* Search and Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Level Filter */}
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>

                    {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(totalRevenue)}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Duration</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + parseInt(c.duration), 0) / courses.length) : 0}h
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Courses Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Course
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Level
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Students
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {courses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No courses found</p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="mt-4"
                                            onClick={handleCreateCourse}
                                            leftIcon={<Plus className="w-4 h-4" />}
                                        >
                                            Create First Course
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-16 h-16 rounded-lg object-cover mr-4"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {course.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {course.instructor}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {course.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                course.level === 'Beginner' ? 'success' :
                                                    course.level === 'Intermediate' ? 'warning' : 'danger'
                                            }>
                                                {course.level}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {course.studentsEnrolled}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatPrice(course.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                                                {course.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewCourse(course)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditCourse(course)}
                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course._id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Course Viewer Modal */}
            <Modal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={selectedCourse?.title || ''}
                size="xl"
            >
                {selectedCourse && (
                    <div className="p-6">
                        <img
                            src={selectedCourse.thumbnail}
                            alt={selectedCourse.title}
                            className="w-full h-64 object-cover rounded-lg mb-6"
                        />
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCourse.instructor}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCourse.category}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCourse.level}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCourse.duration} hours</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                                <p className="font-medium text-gray-900 dark:text-white">{formatPrice(selectedCourse.price)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Students Enrolled</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCourse.studentsEnrolled}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                            <p className="text-gray-900 dark:text-white">{selectedCourse.description}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CourseManagement;
