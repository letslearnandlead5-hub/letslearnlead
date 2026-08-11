import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    ArrowUp,
    ArrowDown,
    FolderPlus,
    Check,
    X,
    BookOpen,
    Layers,
    Tag,
    ChevronRight,
    HelpCircle,
    Info,
    Sparkles,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { quizCategoryService } from '../../services/quizCategoryService';
import api from '../../services/api';
import type { Course, Subject, QuizCategory } from '../../types';
import toast from 'react-hot-toast';

const PRESET_ICONS = ['📝', '🧠', '📑', '🏆', '⚡', '🎯', '📊', '🔬', '📐', '💡', '🎓', '🔥'];

const PRESET_COLORS = [
    { name: 'Green (Basic)', hex: '#10b981', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
    { name: 'Blue (Conceptual)', hex: '#3b82f6', bgClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
    { name: 'Pink (PYQ)', hex: '#ec4899', bgClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800' },
    { name: 'Purple (General)', hex: '#8b5cf6', bgClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
    { name: 'Amber (Speed)', hex: '#f59e0b', bgClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    { name: 'Teal (Advanced)', hex: '#14b8a6', bgClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' },
    { name: 'Rose (Important)', hex: '#f43f5e', bgClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
    { name: 'Indigo (Standard)', hex: '#6366f1', bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
];

export const QuizCategoryManager: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all'); // 'all' | 'course-level' | subject._id
    const [categories, setCategories] = useState<QuizCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Form Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<QuizCategory | null>(null);

    // Form Inputs
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formIcon, setFormIcon] = useState('📝');
    const [formColor, setFormColor] = useState('#6366f1');
    const [formScope, setFormScope] = useState<'subject' | 'course'>('subject'); // default subject-level per user requirement
    const [formSubjectId, setFormSubjectId] = useState<string>('');

    // Load Courses on mount
    useEffect(() => {
        fetchCourses();
    }, []);

    // Load categories when course or subject selection changes
    useEffect(() => {
        if (selectedCourseId) {
            fetchCategories();
        }
    }, [selectedCourseId, selectedSubjectId]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response: any = await api.get('/courses');
            const courseList: Course[] = response.data || [];
            setCourses(courseList);
            if (courseList.length > 0) {
                setSelectedCourseId(courseList[0].id || (courseList[0] as any)._id);
            }
        } catch (error) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        if (!selectedCourseId) return;
        try {
            setCategoriesLoading(true);
            const data = await quizCategoryService.getAdminCategories(selectedCourseId, selectedSubjectId);
            setCategories(data);
        } catch (error) {
            toast.error('Failed to load quiz categories');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const currentCourse = courses.find(c => (c.id || (c as any)._id) === selectedCourseId);
    const currentSubjects = currentCourse?.subjects || [];

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setFormName('');
        setFormDescription('');
        setFormIcon('📝');
        setFormColor('#6366f1');
        // Default to current subject if selected, or first subject if available
        if (selectedSubjectId && selectedSubjectId !== 'all' && selectedSubjectId !== 'course-level') {
            setFormScope('subject');
            setFormSubjectId(selectedSubjectId);
        } else if (currentSubjects.length > 0) {
            setFormScope('subject');
            setFormSubjectId(currentSubjects[0]._id);
        } else {
            setFormScope('course');
            setFormSubjectId('');
        }
        setShowModal(true);
    };

    const handleOpenEditModal = (cat: QuizCategory) => {
        setEditingCategory(cat);
        setFormName(cat.name);
        setFormDescription(cat.description || '');
        setFormIcon(cat.icon || '📝');
        setFormColor(cat.color || '#6366f1');
        if (cat.subjectId) {
            setFormScope('subject');
            setFormSubjectId(cat.subjectId);
        } else {
            setFormScope('course');
            setFormSubjectId('');
        }
        setShowModal(true);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            const subjectIdPayload = formScope === 'subject' && formSubjectId ? formSubjectId : undefined;

            if (editingCategory) {
                await quizCategoryService.updateCategory(editingCategory._id, {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    icon: formIcon,
                    color: formColor,
                    subjectId: subjectIdPayload,
                });
                toast.success('Category updated successfully');
            } else {
                await quizCategoryService.createCategory({
                    courseId: selectedCourseId,
                    subjectId: subjectIdPayload,
                    name: formName.trim(),
                    description: formDescription.trim(),
                    icon: formIcon,
                    color: formColor,
                });
                toast.success('Category created successfully');
            }

            setShowModal(false);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save category');
        }
    };

    const handleToggleActive = async (cat: QuizCategory) => {
        try {
            await quizCategoryService.updateCategory(cat._id, {
                isActive: !cat.isActive,
            });
            toast.success(`Category ${!cat.isActive ? 'activated' : 'disabled'}`);
            fetchCategories();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteCategory = async (cat: QuizCategory) => {
        if (!window.confirm(`Are you sure you want to delete "${cat.name}"? Quizzes with this category will become uncategorized.`)) {
            return;
        }

        try {
            await quizCategoryService.deleteCategory(cat._id);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === categories.length - 1)
        ) {
            return;
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const newCategories = [...categories];

        // Swap order numbers
        const tempOrder = newCategories[index].order;
        newCategories[index].order = newCategories[targetIndex].order;
        newCategories[targetIndex].order = tempOrder;

        // Swap array items
        const temp = newCategories[index];
        newCategories[index] = newCategories[targetIndex];
        newCategories[targetIndex] = temp;

        setCategories(newCategories);

        try {
            await quizCategoryService.reorderCategories(
                newCategories.map((c, i) => ({ id: c._id, order: i }))
            );
            toast.success('Order updated');
        } catch (error) {
            toast.error('Failed to update order');
            fetchCategories();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title & Top Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                            <span onClick={() => navigate('/admin/quizzes/')} className="hover:underline cursor-pointer">
                                Quiz Management
                            </span>
                            <ChevronRight className="w-4 h-4" />
                            <span>Quiz Categories</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Tag className="w-8 h-8 text-indigo-600" />
                            Dynamic Quiz Categories
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Manage course & subject-specific quiz categories (Basic, Conceptual, PYQ, General Exam, etc.)
                        </p>
                    </div>

                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Category
                    </button>
                </div>

                {/* Main Control Panel Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Course Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                1. Select Course
                            </label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => {
                                    setSelectedCourseId(e.target.value);
                                    setSelectedSubjectId('all');
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                            >
                                {courses.map((course) => {
                                    const cId = course.id || (course as any)._id;
                                    return (
                                        <option key={cId} value={cId}>
                                            {course.title} ({course.subjects?.length || 0} Subjects)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* 2. Subject Filter Tabs */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                2. Filter Subject Scope
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedSubjectId('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        selectedSubjectId === 'all'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                                >
                                    All Categories
                                </button>
                                <button
                                    onClick={() => setSelectedSubjectId('course-level')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        selectedSubjectId === 'course-level'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                                >
                                    🌐 Course-level Only
                                </button>
                                {currentSubjects.map((sub) => (
                                    <button
                                        key={sub._id}
                                        onClick={() => setSelectedSubjectId(sub._id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                                            selectedSubjectId === sub._id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span>{sub.icon || '📚'}</span>
                                        <span>{sub.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Table / List */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                {currentCourse?.title} — Categories ({categories.length})
                            </h2>
                        </div>
                        <span className="text-xs text-gray-500">
                            Use arrows to reorder category display
                        </span>
                    </div>

                    {categoriesLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Loading categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-12 text-center">
                            <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                No Quiz Categories Found
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                                Add categories like <strong>Basic</strong>, <strong>Conceptual</strong>, <strong>PYQ</strong>, or <strong>General Exam</strong> for this course/subject.
                            </p>
                            <button
                                onClick={handleOpenAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Category
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                            {categories.map((cat, index) => {
                                const subjectObj = currentSubjects.find(s => s._id === cat.subjectId);
                                const colorPreset = PRESET_COLORS.find(c => c.hex === cat.color) || PRESET_COLORS[0];

                                return (
                                    <div
                                        key={cat._id}
                                        className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                                            !cat.isActive ? 'opacity-60 bg-gray-50/50 dark:bg-gray-950/50' : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        {/* Left Info */}
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            {/* Reorder Buttons */}
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button
                                                    onClick={() => handleMoveOrder(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveOrder(index, 'down')}
                                                    disabled={index === categories.length - 1}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Badge Preview */}
                                            <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 font-semibold text-sm ${colorPreset.bgClass}`}>
                                                <span className="text-lg">{cat.icon || '📝'}</span>
                                                <span>{cat.name}</span>
                                            </div>

                                            {/* Category Details */}
                                            <div className="min-w-0 hidden sm:block">
                                                {cat.description && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {cat.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-medium text-gray-500">
                                                        Scope: {cat.subjectId ? `Subject (${subjectObj?.name || 'Specific'})` : '🌐 Course-wide'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Controls */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {/* Active Switch */}
                                            <button
                                                onClick={() => handleToggleActive(cat)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    cat.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                                                }`}
                                                title={cat.isActive ? 'Active (Click to disable)' : 'Disabled (Click to activate)'}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        cat.isActive ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>

                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleOpenEditModal(cat)}
                                                className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                title="Edit Category"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-2 text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                title="Delete Category"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Add / Edit Category */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-600" />
                                    {editingCategory ? 'Edit Quiz Category' : 'Create Quiz Category'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body / Form */}
                            <form onSubmit={handleSaveCategory} className="p-6 space-y-5">
                                {/* Scope Picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Category Scope
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormScope('subject')}
                                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                                formScope === 'subject'
                                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                🎯 Subject-Specific (Recommended)
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Applies only to a specific subject (e.g. Biology)
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormScope('course')}
                                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                                formScope === 'course'
                                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                🌐 Course-Level
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Shared across all subjects in this course
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Subject Select (If scope is Subject) */}
                                {formScope === 'subject' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                            Select Subject *
                                        </label>
                                        <select
                                            value={formSubjectId}
                                            onChange={(e) => setFormSubjectId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                            required
                                        >
                                            {currentSubjects.map((s) => (
                                                <option key={s._id} value={s._id}>
                                                    {s.icon || '📚'} {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Category Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        Category Name * (e.g. Basic, Conceptual, PYQ, General Exam)
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Conceptual Questions"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                                        required
                                    />
                                </div>

                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        Category Icon
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {PRESET_ICONS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFormIcon(emoji)}
                                                className={`w-9 h-9 text-lg rounded-lg border flex items-center justify-center transition-all ${
                                                    formIcon === emoji
                                                        ? 'bg-indigo-100 border-indigo-600 dark:bg-indigo-950'
                                                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Theme Picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        Color Theme
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color.hex}
                                                type="button"
                                                onClick={() => setFormColor(color.hex)}
                                                className={`p-2 rounded-lg border text-xs font-medium text-center flex items-center justify-center gap-1.5 ${
                                                    formColor === color.hex ? 'ring-2 ring-indigo-500 border-indigo-600' : 'border-gray-200 dark:border-gray-800'
                                                }`}
                                            >
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color.hex }} />
                                                <span className="truncate">{color.name.split(' ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Live Preview Box */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                                        Live Badge Preview
                                    </span>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold" style={{ color: formColor, borderColor: `${formColor}40`, backgroundColor: `${formColor}10` }}>
                                        <span>{formIcon}</span>
                                        <span>{formName || 'Category Name'}</span>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                                    >
                                        {editingCategory ? 'Save Changes' : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizCategoryManager;
