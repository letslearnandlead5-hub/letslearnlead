import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, BookOpen, ShoppingCart, User, Award, LogOut, MessageSquare, Menu, X } from 'lucide-react';
import axios from 'axios';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

interface Course {
    _id: string;
    title: string;
}

const SubmitDoubt: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const { logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        courseId: '',
        courseName: '',
        category: 'general' as 'course' | 'general' | 'technical' | 'other',
        priority: 'medium' as 'low' | 'medium' | 'high',
    });

    const tabs = [
        { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/dashboard' },
        { id: 'purchases', label: 'My Purchases', icon: ShoppingCart, path: '/dashboard' },
        { id: 'doubts', label: 'My Doubts', icon: MessageSquare, path: '/dashboard' },
        { id: 'profile', label: 'My Profile', icon: User, path: '/dashboard' },
        { id: 'certificates', label: 'Certificates', icon: Award, path: '/dashboard' },
    ];

    const handleLogout = () => {
        logout();
        addToast({ type: 'success', message: 'Logged out successfully!' });
        navigate('/login');
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const authStorage = localStorage.getItem('auth-storage');
            let token = '';
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed?.state?.token || '';
            }

            // Fetch enrolled courses instead of all courses
            const response = await axios.get(`${API_URL}/courses/enrolled/my-courses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            console.log('Enrolled courses response:', response.data);
            
            // The response contains data array
            const enrolledCourses = response.data.data || [];
            console.log('Enrolled courses:', enrolledCourses);
            setCourses(enrolledCourses);
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            // If error, set empty array
            setCourses([]);
        }
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCourse = courses.find((c) => c._id === e.target.value);
        setFormData({
            ...formData,
            courseId: e.target.value,
            courseName: selectedCourse?.title || '',
            category: e.target.value ? 'course' : formData.category,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            addToast({ message: 'Please fill in all required fields', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const authStorage = localStorage.getItem('auth-storage');
            let token = '';
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed?.state?.token || '';
            }

            await axios.post(
                `${API_URL}/doubts`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            addToast({ message: 'Doubt submitted successfully! Admin will respond soon.', type: 'success' });
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error submitting doubt:', error);
            addToast({
                message: error.response?.data?.message || 'Failed to submit doubt',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Sidebar Navigation - Hidden on mobile, visible on lg+, sticky on desktop */}
            <div className={`fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 h-screen border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${
                showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="p-6 flex-shrink-0 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
                    <button
                        onClick={() => setShowMobileSidebar(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            onClick={() => setShowMobileSidebar(false)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                tab.id === 'doubts'
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="font-medium">{tab.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors mt-6"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </div>

            {/* Overlay for mobile sidebar */}
            {showMobileSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="lg:hidden mb-4 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Submit a Doubt
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Ask your question and our expert team will help you
                        </p>
                    </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Brief summary of your doubt"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Related Course */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Related Course (Optional)
                        </label>
                        <select
                            value={formData.courseId}
                            onChange={handleCourseChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Select a course (if applicable)</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    category: e.target.value as 'course' | 'general' | 'technical' | 'other',
                                })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        >
                            <option value="general">General Question</option>
                            <option value="course">Course Related</option>
                            <option value="technical">Technical Issue</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    priority: e.target.value as 'low' | 'medium' | 'high',
                                })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide detailed information about your doubt..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            required
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit Doubt
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    );
};

export default SubmitDoubt;
