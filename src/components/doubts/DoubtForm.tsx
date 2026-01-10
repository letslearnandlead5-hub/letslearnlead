import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface DoubtFormProps {
    onClose: () => void;
    onSubmit: (doubtData: {
        subject: string;
        description: string;
        courseId?: string;
        courseName?: string;
        category: 'course' | 'general' | 'technical' | 'other';
        priority: 'low' | 'medium' | 'high';
    }) => void;
    isOpen: boolean;
}

interface Course {
    _id: string;
    title: string;
}

const DoubtForm: React.FC<DoubtFormProps> = ({ onClose, onSubmit, isOpen }) => {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        courseId: '',
        courseName: '',
        category: 'general' as 'course' | 'general' | 'technical' | 'other',
        priority: 'medium' as 'low' | 'medium' | 'high',
    });
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch user's enrolled courses
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses/enrolled`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setCourses(response.data.data || []);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };

        if (isOpen) {
            fetchCourses();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                subject: formData.subject,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                ...(formData.courseId && {
                    courseId: formData.courseId,
                    courseName: formData.courseName,
                }),
            };

            await onSubmit(submitData);

            // Reset form
            setFormData({
                subject: '',
                description: '',
                courseId: '',
                courseName: '',
                category: 'general',
                priority: 'medium',
            });
        } catch (error) {
            console.error('Error submitting doubt:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const courseId = e.target.value;
        const course = courses.find((c) => c._id === courseId);
        setFormData({
            ...formData,
            courseId,
            courseName: course?.title || '',
            category: courseId ? 'course' : 'general',
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Submit a Doubt
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary of your doubt"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Related Course (Optional)
                                </label>
                                <select
                                    value={formData.courseId}
                                    onChange={handleCourseChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                >
                                    <option value="general">General Question</option>
                                    <option value="course">Course Related</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['low', 'medium', 'high'] as const).map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority })}
                                            className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${formData.priority === priority
                                                    ? priority === 'high'
                                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                        : priority === 'medium'
                                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                                            : 'border-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide detailed information about your doubt..."
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Submitting...' : 'Submit Doubt'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DoubtForm;
