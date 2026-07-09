import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, BookOpen, Users, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp, QrCode, Plus, Trash2, ChevronDown, ChevronUp, BookMarked, DollarSign } from 'lucide-react';
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
    // Track whether the admin actually changed the image fields.
    // If not changed, we omit them from the PUT payload to avoid 413 errors
    // (the existing images are already stored in the DB and don't need re-uploading).
    const [thumbnailChanged, setThumbnailChanged] = useState(false);
    const [qrImageChanged, setQrImageChanged] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructor: '',
        thumbnail: '',
        price: '0',
        originalPrice: '',
        duration: '',
        category: '',
        grade: '',
        level: 'beginner',
        medium: 'kannada',
        featuredOnHome: false,
        sections: [] as any[],
        // Subjects (new subject-based structure)
        subjects: [] as Array<{
            _id?: string;
            name: string;
            description: string;
            icon: string;
            price: number;
            originalPrice?: number;
            order: number;
            sections: any[];
        }>,
        // Payment settings
        paymentEnabled: false,
        paymentMethod: 'qr',
        qrImage: '',
        upiId: '',
        merchantName: '',
        paymentInstructions: 'Scan the QR using PhonePe, Google Pay, Paytm or any UPI app. After payment, enter your Transaction ID below.',
    });

    // Subject form state for the add/edit modal
    const [subjectForm, setSubjectForm] = useState({ name: '', description: '', icon: '\ud83d\udcda', price: '', originalPrice: '' });
    const [editingSubjectIdx, setEditingSubjectIdx] = useState<number | null>(null);
    const [showSubjectForm, setShowSubjectForm] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

    // Suggested icons for common subjects
    const SUBJECT_ICONS = ['\ud83d\udcda','\ud83d\udcd0','\ud83d\udd2c','\ud83c\udf0d','\ud83d\udcdd','\ud83e\uddd1\u200d\ud83d\udcbb','\ud83e\uddea','\ud83d\udc69\u200d\ud83d\udd2c','\ud83d\udd22','\ud83c\udfa8','\ud83c\udfb5','\ud83c\udfc5','\u2696\ufe0f','\ud83c\udf31','\ud83d\udcb0','\ud83d\ude80','\ud83d\uddfa\ufe0f','\ud83e\udde0'];

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
                price: (course.price || 0).toString(),
                originalPrice: course.originalPrice?.toString() || '',
                duration: course.duration,
                category: course.category,
                grade: course.grade || '',
                level: course.level,
                medium: course.medium || 'kannada',
                featuredOnHome: course.featuredOnHome === true,
                sections: course.sections || [],
                subjects: (course.subjects || []).map((s: any, i: number) => ({ ...s, order: s.order ?? i })),
                // Payment settings
                paymentEnabled: course.paymentEnabled || false,
                paymentMethod: course.paymentMethod || 'qr',
                qrImage: course.qrImage || '',
                upiId: course.upiId || '',
                merchantName: course.merchantName || '',
                paymentInstructions: course.paymentInstructions || 'Scan the QR using PhonePe, Google Pay, Paytm or any UPI app. After payment, enter your Transaction ID below.',
            });
            // Reset change-tracking: existing images don't need to be re-uploaded
            setThumbnailChanged(false);
            setQrImageChanged(false);
        } catch (error) {
            console.error('Error loading course:', error);
            addToast({ type: 'error', message: 'Failed to load course' });
            navigate('/dashboard/');
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

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
                addToast({ type: 'error', message: 'Please upload a JPEG or PNG image' });
                e.target.value = '';
                return;
            }

            // Validate file size (max 5MB original)
            if (file.size > 5 * 1024 * 1024) {
                addToast({ type: 'error', message: 'Image size should be less than 5MB' });
                e.target.value = '';
                return;
            }

            // Compress + convert to base64 using canvas
            // Target: ~40-60KB base64 output to stay well under the server limit
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Max dimensions: 600×450 — sufficient for a course thumbnail card
                    const MAX_W = 600;
                    const MAX_H = 450;
                    let { width, height } = img;
                    if (width > MAX_W || height > MAX_H) {
                        const ratio = Math.min(MAX_W / width, MAX_H / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, width, height);
                    // Quality 0.72 → good visual quality, ~55-65KB base64 output
                    const compressed = canvas.toDataURL('image/jpeg', 0.72);

                    // Warn if still large after compression
                    const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);
                    if (sizeKB > 300) {
                        addToast({ type: 'warning', message: `Thumbnail is ${sizeKB}KB after compression. Consider using a simpler image to avoid upload issues.` });
                    }

                    setFormData(prev => ({ ...prev, thumbnail: compressed }));
                    setThumbnailChanged(true); // Mark as changed so it gets included in the save
                };
                img.onerror = () => {
                    addToast({ type: 'error', message: 'Failed to process image' });
                };
                img.src = reader.result as string;
            };
            reader.onerror = () => {
                addToast({ type: 'error', message: 'Failed to read image file' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteThumbnail = () => {
        setFormData(prev => ({ ...prev, thumbnail: '' }));
        setThumbnailChanged(true); // Explicitly clearing is also a change
        // Reset file input
        const fileInput = document.querySelector('input[name="thumbnail"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            // Build base payload
            const courseData: any = {
                title: formData.title,
                description: formData.description,
                instructor: formData.instructor,
                price: parseFloat(formData.price) || 0,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                duration: formData.duration,
                category: formData.category,
                grade: formData.grade || undefined,
                level: formData.level,
                medium: formData.medium,
                featuredOnHome: formData.featuredOnHome,
                sections: formData.sections,
                subjects: formData.subjects.map((s, i) => ({ ...s, order: i })),
                // Payment text fields
                paymentEnabled: formData.paymentEnabled,
                paymentMethod: formData.paymentMethod,
                upiId: formData.upiId,
                merchantName: formData.merchantName,
                paymentInstructions: formData.paymentInstructions,
            };

            // Only include large base64 image fields if they were actually changed.
            // For existing courses: if the admin didn't touch the image, MongoDB keeps
            // the existing value — no need to re-upload it and blow up the payload.
            const isNew = !id;
            if (isNew || thumbnailChanged) {
                courseData.thumbnail = formData.thumbnail;
            }
            if (isNew || qrImageChanged) {
                courseData.qrImage = formData.qrImage;
            }

            // Debug: log approximate payload size
            const payloadSize = new Blob([JSON.stringify(courseData)]).size;
            console.log(`📊 Course payload size: ${(payloadSize / 1024).toFixed(1)} KB (thumbnail ${thumbnailChanged ? 'included' : 'skipped'}, qr ${qrImageChanged ? 'included' : 'skipped'})`);

            if (id) {
                await courseAPI.update(id, courseData);
                addToast({ type: 'success', message: 'Course updated successfully!' });
            } else {
                await courseAPI.create(courseData);
                addToast({ type: 'success', message: 'Course created successfully!' });
            }

            // Navigate to dashboard and select courses tab
            navigate('/dashboard/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'courses' }));
            }, 100);
        } catch (error: any) {
            console.error('Error saving course:', error);

            // Detect 413 Content Too Large — usually caused by a very large thumbnail or QR image
            const status = error?.status || error?.response?.status;
            const isTooLarge = status === 413 ||
                String(error).includes('413') ||
                String(error?.message).includes('Too Large') ||
                String(error?.message).includes('Content Too Large');

            if (isTooLarge) {
                addToast({
                    type: 'error',
                    message: '📷 Image is too large to save. Please upload a smaller thumbnail (under 200KB) and try again.',
                });
            } else {
                addToast({
                    type: 'error',
                    message: error?.message || error?.response?.data?.message || 'Failed to save course. Please try again.',
                });
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        addToast({ type: 'success', message: 'Logged out successfully!' });
        navigate('/login/');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: TrendingUp, path: '/dashboard' },
        { id: 'students', label: 'Students', icon: Users, path: '/dashboard' },
        { id: 'users', label: 'All Users', icon: Users, path: '/dashboard' },
        { id: 'courses', label: 'Courses', icon: BookOpen, path: '/dashboard' },
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
                <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
                                    window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: tab.id }));
                                    navigate(`${tab.path}/`);
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
                                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'settings' }));
                                navigate('/dashboard/');
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
                                        navigate('/dashboard/');
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

                                        {/* Thumbnail Image */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Thumbnail Image *
                                            </label>
                                            <input
                                                type="file"
                                                name="thumbnail"
                                                onChange={handleThumbnailChange}
                                                accept="image/jpeg,image/jpg,image/png"
                                                required={!formData.thumbnail}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Upload a JPEG or PNG image (max 5MB)
                                            </p>
                                            {formData.thumbnail && (
                                                <div className="mt-3 flex items-start gap-4">
                                                    <img
                                                        src={formData.thumbnail}
                                                        alt="Thumbnail preview"
                                                        className="w-48 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                onChange={handleThumbnailChange}
                                                                accept="image/jpeg,image/jpg,image/png"
                                                                className="hidden"
                                                            />
                                                            <span className="inline-flex items-center px-4 py-2 rounded-lg border border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors text-sm font-medium">
                                                                Change
                                                            </span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={handleDeleteThumbnail}
                                                            className="px-4 py-2 rounded-lg border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-sm font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {/* Duration, Category, and Grade */}
                                        <div className="grid grid-cols-3 gap-4">
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
                                                    placeholder="e.g., 1 Year"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Category (Subject) *
                                                </label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleFormChange}
                                                    required
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">Select Category</option>
                                                    <optgroup label="School">
                                                        <option value="school-6-10">🏫 School — Class 6 to 10</option>
                                                        <option value="school-puc">🎓 PUC — Class 11 &amp; 12</option>
                                                    </optgroup>
                                                    <optgroup label="Competitive Exams">
                                                        <option value="neet">🩺 NEET Preparation</option>
                                                        <option value="jee">⚙️ JEE Preparation</option>
                                                        <option value="kcet">📋 KCET Preparation</option>
                                                        <option value="upsc">🏛️ UPSC / Government Exams</option>
                                                        <option value="competitive">📝 Other Competitive Exams</option>
                                                    </optgroup>
                                                    <optgroup label="Other">
                                                        <option value="college">🎯 College / Degree</option>
                                                        <option value="skills">💼 Skills &amp; Certification</option>
                                                        <option value="other">📦 Other</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Grade / Standard
                                                </label>
                                                <select
                                                    name="grade"
                                                    value={formData.grade}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">Select Grade</option>
                                                    <optgroup label="School">
                                                        <option value="6th">6th Standard</option>
                                                        <option value="7th">7th Standard</option>
                                                        <option value="8th">8th Standard</option>
                                                        <option value="9th">9th Standard</option>
                                                        <option value="10th">10th Standard (SSLC)</option>
                                                        <option value="11th">11th Standard (PUC 1)</option>
                                                        <option value="12th">12th Standard (PUC 2)</option>
                                                    </optgroup>
                                                    <optgroup label="Competitive / Other">
                                                        <option value="neet">NEET</option>
                                                        <option value="jee">JEE</option>
                                                        <option value="kcet">KCET</option>
                                                        <option value="upsc">UPSC</option>
                                                        <option value="college">College / Degree</option>
                                                        <option value="open">Open to All</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Medium */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Medium *
                                            </label>
                                            <select
                                                name="medium"
                                                value={formData.medium}
                                                onChange={handleFormChange}
                                                required
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="kannada">🔵 Kannada Medium</option>
                                                <option value="english">🟢 English Medium</option>
                                            </select>
                                        </div>

                                        {/* Show on Homepage Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">🏠 Show on Homepage</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {formData.featuredOnHome
                                                        ? 'This course is visible on the homepage'
                                                        : 'This course is hidden from the homepage'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, featuredOnHome: !prev.featuredOnHome }))}
                                                className={`relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.featuredOnHome
                                                        ? 'bg-primary-600'
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.featuredOnHome ? 'translate-x-8' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </Card>

                                {/* ── Subjects Manager ─────────────────────────────────── */}
                                <Card className="p-6 mb-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-950 rounded-xl flex items-center justify-center">
                                                <BookMarked className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">Subjects</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Add subjects with individual pricing (e.g. Mathematics ₹999)</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSubjectForm({ name: '', description: '', icon: '📚', price: '', originalPrice: '' }); setEditingSubjectIdx(null); setShowSubjectForm(true); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" /> Add Subject
                                        </button>
                                    </div>

                                    {/* Subject list */}
                                    {formData.subjects.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                            <p className="text-4xl mb-3">📚</p>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No subjects yet</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Subject" to add Mathematics, Science, etc.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.subjects.map((subject, idx) => (
                                                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                                                    {/* Subject header row */}
                                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/60">
                                                        <span className="text-2xl w-8 flex-shrink-0 text-center">{subject.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 dark:text-white truncate">{subject.name}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">₹{subject.price}</span>
                                                                {subject.originalPrice && <span className="text-xs text-gray-400 line-through">₹{subject.originalPrice}</span>}
                                                                {subject.description && <span className="text-xs text-gray-500 truncate">{subject.description}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {/* Move up */}
                                                            {idx > 0 && (
                                                                <button type="button" onClick={() => {
                                                                    const arr = [...formData.subjects];
                                                                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                                                    setFormData(prev => ({ ...prev, subjects: arr }));
                                                                }} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                                                                    <ChevronUp className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {/* Move down */}
                                                            {idx < formData.subjects.length - 1 && (
                                                                <button type="button" onClick={() => {
                                                                    const arr = [...formData.subjects];
                                                                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                                                    setFormData(prev => ({ ...prev, subjects: arr }));
                                                                }} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => {
                                                                setSubjectForm({ name: subject.name, description: subject.description || '', icon: subject.icon || '📚', price: subject.price.toString(), originalPrice: subject.originalPrice?.toString() || '' });
                                                                setEditingSubjectIdx(idx);
                                                                setShowSubjectForm(true);
                                                            }} className="px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-colors">
                                                                Edit
                                                            </button>
                                                            <button type="button" onClick={() => {
                                                                setFormData(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== idx) }));
                                                                if (expandedSubject === idx) setExpandedSubject(null);
                                                            }} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <button type="button" onClick={() => setExpandedSubject(expandedSubject === idx ? null : idx)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                                                                {expandedSubject === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded: subject sections builder */}
                                                    {expandedSubject === idx && (
                                                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Course Content for {subject.name}</p>
                                                            <CourseContentBuilder
                                                                sections={subject.sections || []}
                                                                onChange={(sections) => {
                                                                    const updated = [...formData.subjects];
                                                                    updated[idx] = { ...updated[idx], sections };
                                                                    setFormData(prev => ({ ...prev, subjects: updated }));
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add / Edit subject inline form */}
                                    {showSubjectForm && (
                                        <div className="mt-4 p-5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                                                {editingSubjectIdx !== null ? 'Edit Subject' : 'New Subject'}
                                            </h4>
                                            <div className="space-y-4">
                                                {/* Icon picker */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {SUBJECT_ICONS.map(icon => (
                                                            <button
                                                                key={icon}
                                                                type="button"
                                                                onClick={() => setSubjectForm(prev => ({ ...prev, icon }))}
                                                                className={`text-xl w-10 h-10 rounded-xl border-2 transition-all ${
                                                                    subjectForm.icon === icon
                                                                        ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/60 scale-110'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                                                                }`}
                                                            >{icon}</button>
                                                        ))}
                                                        <input
                                                            type="text"
                                                            placeholder="Custom"
                                                            value={SUBJECT_ICONS.includes(subjectForm.icon) ? '' : subjectForm.icon}
                                                            onChange={e => setSubjectForm(prev => ({ ...prev, icon: e.target.value }))}
                                                            className="w-20 text-center px-2 py-1 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-violet-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Name */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name *</label>
                                                        <input
                                                            type="text"
                                                            value={subjectForm.name}
                                                            onChange={e => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                            placeholder="e.g. Mathematics, Science"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            value={subjectForm.description}
                                                            onChange={e => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                            placeholder="Short description (optional)"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={subjectForm.price}
                                                                onChange={e => setSubjectForm(prev => ({ ...prev, price: e.target.value }))}
                                                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                                placeholder="999"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Price (₹)</label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={subjectForm.originalPrice}
                                                                onChange={e => setSubjectForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                                                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                                placeholder="1499 (optional)"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!subjectForm.name.trim()) { addToast({ type: 'error', message: 'Subject name is required' }); return; }
                                                            if (!subjectForm.price || isNaN(parseFloat(subjectForm.price))) { addToast({ type: 'error', message: 'Price is required' }); return; }
                                                            const newSubject = {
                                                                name: subjectForm.name.trim(),
                                                                description: subjectForm.description.trim(),
                                                                icon: subjectForm.icon || '📚',
                                                                price: parseFloat(subjectForm.price),
                                                                originalPrice: subjectForm.originalPrice ? parseFloat(subjectForm.originalPrice) : undefined,
                                                                order: editingSubjectIdx !== null ? editingSubjectIdx : formData.subjects.length,
                                                                sections: editingSubjectIdx !== null ? formData.subjects[editingSubjectIdx].sections : [],
                                                                _id: editingSubjectIdx !== null ? formData.subjects[editingSubjectIdx]._id : undefined,
                                                            };
                                                            if (editingSubjectIdx !== null) {
                                                                const updated = [...formData.subjects];
                                                                updated[editingSubjectIdx] = newSubject;
                                                                setFormData(prev => ({ ...prev, subjects: updated }));
                                                            } else {
                                                                setFormData(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
                                                            }
                                                            setShowSubjectForm(false);
                                                            setEditingSubjectIdx(null);
                                                        }}
                                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
                                                    >
                                                        {editingSubjectIdx !== null ? 'Update Subject' : 'Add Subject'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowSubjectForm(false); setEditingSubjectIdx(null); }}
                                                        className="px-5 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>


                                {/* Payment Settings */}
                                <Card className="p-6 mb-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
                                            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Payment Settings</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure QR payment for this course</p>
                                        </div>
                                    </div>

                                    {/* Enable Payment Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Enable Paid Access (Per-Subject Purchase)</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Enables QR/Gateway checkout. Students will purchase subjects individually based on each subject's price.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, paymentEnabled: !prev.paymentEnabled }))}
                                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${formData.paymentEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.paymentEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {formData.paymentEnabled && (
                                        <div className="space-y-4">
                                            {/* Payment Method */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                                <select
                                                    value={formData.paymentMethod}
                                                    onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="qr">QR Code Only</option>
                                                    <option value="gateway">Payment Gateway Only</option>
                                                    <option value="both">QR + Gateway</option>
                                                </select>
                                            </div>

                                            {/* QR Image Upload */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code Image</label>
                                                {formData.qrImage ? (
                                                    <div className="relative inline-block">
                                                        <img src={formData.qrImage} alt="QR Code" className="w-48 h-48 object-contain border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-2 bg-white" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { setFormData(prev => ({ ...prev, qrImage: '' })); setQrImageChanged(true); }}
                                                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-gray-50 dark:bg-gray-800">
                                                        <QrCode className="w-8 h-8 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Upload QR Code image</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG · Max 5MB</p>
                                                        <input
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp"
                                                            className="hidden"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    addToast({ type: 'error', message: 'QR image must be < 5MB' });
                                                                    return;
                                                                }
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    const img = new Image();
                                                                    img.onload = () => {
                                                                        const canvas = document.createElement('canvas');
                                                                        const MAX = 600;
                                                                        let { width, height } = img;
                                                                        if (width > MAX || height > MAX) {
                                                                            const ratio = Math.min(MAX / width, MAX / height);
                                                                            width = Math.round(width * ratio);
                                                                            height = Math.round(height * ratio);
                                                                        }
                                                                        canvas.width = width;
                                                                        canvas.height = height;
                                                                        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                                                                        const compressed = canvas.toDataURL('image/png', 0.9);
                                                                        setFormData(prev => ({ ...prev, qrImage: compressed }));
                                                                        setQrImageChanged(true); // Mark QR as changed
                                                                    };
                                                                    img.src = reader.result as string;
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {/* UPI ID */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.upiId}
                                                    onChange={e => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g. name@phonpe or name@okicici"
                                                />
                                            </div>

                                            {/* Merchant Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant / Account Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.merchantName}
                                                    onChange={e => setFormData(prev => ({ ...prev, merchantName: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Name shown in UPI apps"
                                                />
                                            </div>

                                            {/* Payment Instructions */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Instructions</label>
                                                <textarea
                                                    value={formData.paymentInstructions}
                                                    onChange={e => setFormData(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                    placeholder="Instructions shown to students on the payment screen"
                                                />
                                            </div>
                                        </div>
                                    )}
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
