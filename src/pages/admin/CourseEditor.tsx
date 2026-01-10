import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, BookOpen, Users, ShoppingCart, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import CourseContentBuilder from '../../components/admin/CourseContentBuilder';
import AdminHeader from '../../components/admin/AdminHeader';
import type { ISection } from '../../types/course';

const CourseEditor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToastStore();
    const { logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructor: '',
        thumbnail: '',
        price: '',
        originalPrice: '',
        duration: '',
        category: '',
        level: 'beginner',
        sections: [] as ISection[],
    });

    // Load course data if editing
    useEffect(() => {
        if (id) {
            loadCourse();
        }
    }, [id]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            const response = await courseAPI.getById(id!);
            const course = response.data;

            setFormData({
                title: course.title,
                description: course.description,
                instructor: course.instructor,
                thumbnail: course.thumbnail,
                price: course.price.toString(),
                originalPrice: course.originalPrice?.toString() || '',
                duration: course.duration,
                category: course.category,
                level: course.level,
                sections: course.sections || [],
            });
        } catch (error) {
            console.error('Error loading course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
            navigate('/dashboard');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'courses' }));
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            const courseData = {
                title: formData.title,
                description: formData.description,
                instructor: formData.instructor,
                thumbnail: formData.thumbnail,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                duration: formData.duration,
                category: formData.category,
                level: formData.level,
                sections: formData.sections,
            };

            if (id) {
                await courseAPI.update(id, courseData);
                addToast({ type: 'success', message: 'Course updated successfully!' });
            } else {
                await courseAPI.create(courseData);
                addToast({ type: 'success', message: 'Course created successfully!' });
            }

            // Navigate to dashboard and select courses tab
            navigate('/dashboard');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'courses' }));
            }, 100);
        } catch (error: any) {
            console.error('Error saving course:', error);
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to save course'
            });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        addToast({ type: 'success', message: 'Logged out successfully!' });
        navigate('/login');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: TrendingUp, path: '/dashboard' },
        { id: 'students', label: 'Students', icon: Users, path: '/dashboard' },
        { id: 'users', label: 'All Users', icon: Users, path: '/dashboard' },
        { id: 'courses', label: 'Courses', icon: BookOpen, path: '/dashboard' },
        { id: 'products', label: 'Products', icon: ShoppingCart, path: '/dashboard' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/dashboard' },
        { id: 'notes', label: 'Notes', icon: FileText, path: '/dashboard' },
        { id: 'doubts', label: 'Student Doubts', icon: MessageSquare, path: '/dashboard' },
        { id: 'notifications', label: 'Notifications', icon: Brain, path: '/dashboard' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header - Full Width */}
            <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
            
            <div className="flex">
                {/* Sidebar - Responsive and Sticky */}
                <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${
                    showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                    <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 lg:hidden">
                        <div className="flex items-center justify-end">
                            <button
                                onClick={() => setShowMobileSidebar(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    navigate(tab.path);
                                    setShowMobileSidebar(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                navigate('/dashboard');
                                setShowMobileSidebar(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </nav>
                </div>

                {/* Overlay for mobile sidebar */}
                {showMobileSidebar && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowMobileSidebar(false)}
                    ></div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-5xl mx-auto">
                            {/* Header */}
                            <div className="mb-6">
                                <Button
                                    variant="ghost"
                                    leftIcon={<ArrowLeft className="w-5 h-5" />}
                                    onClick={() => {
                                        navigate('/dashboard');
                                        // Use a small delay to ensure navigation completes
                                        setTimeout(() => {
                                            window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'courses' }));
                                        }, 100);
                                    }}
                                    className="mb-4"
                                >
                                    Back to Courses
                                </Button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {id ? 'Edit Course' : 'Create New Course'}
                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {id ? 'Update course information and content' : 'Add a new course to your platform'}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit}>
                                <Card className="p-6 mb-6">
                                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Course Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleFormChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Complete Web Development Course"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                required
                                rows={4}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Describe what students will learn in this course..."
                            />
                        </div>

                        {/* Instructor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Instructor Name *
                            </label>
                            <input
                                type="text"
                                name="instructor"
                                value={formData.instructor}
                                onChange={handleFormChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        {/* Thumbnail URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Thumbnail URL *
                            </label>
                            <input
                                type="url"
                                name="thumbnail"
                                value={formData.thumbnail}
                                onChange={handleFormChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        {/* Price and Original Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleFormChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="999"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Original Price (₹)
                                </label>
                                <input
                                    type="number"
                                    name="originalPrice"
                                    value={formData.originalPrice}
                                    onChange={handleFormChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="1999"
                                />
                            </div>
                        </div>

                        {/* Duration and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Duration *
                                </label>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g., 40h or 6 weeks"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category *
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g., Programming, Design"
                                />
                            </div>
                        </div>

                        {/* Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Level *
                            </label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleFormChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Course Content */}
                <Card className="p-6 mb-6">
                    <CourseContentBuilder
                        sections={formData.sections}
                        onChange={(sections) => setFormData(prev => ({ ...prev, sections }))}
                    />
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            navigate('/dashboard');
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'courses' }));
                            }, 100);
                        }}
                        disabled={formSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={formSubmitting}
                    >
                        {formSubmitting ? 'Saving...' : id ? 'Update Course' : 'Create Course'}
                    </Button>
                </div>
            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEditor;
