import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, BookOpen, Users, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import NoteForm from '../../components/notes/NoteForm';
import { noteAPI, courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import AdminHeader from '../../components/admin/AdminHeader';

const NoteEditor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToastStore();
    const { logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100 for file uploads
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [formInitialData, setFormInitialData] = useState<any>(null);

    // Load note data if editing
    useEffect(() => {
        fetchCourses();
        if (id) {
            loadNote();
        }
    }, [id]);

    const fetchCourses = async () => {
        try {
            // noThumbnail=true keeps payload small but still includes subjects (names/prices)
            const response = await courseAPI.getAll({ noThumbnail: true });
            setCourses(response.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const loadNote = async () => {
        try {
            setLoading(true);
            const response = await noteAPI.getById(id!);
            const note = response.data;

            setFormInitialData({
                title: note.title,
                description: note.description,
                markdownContent: note.markdownContent || '',
                courseId: note.courseId?._id || note.courseId,
                subjectId: note.subjectId || '',
                subjectName: note.subjectName || '',
                fileType: note.fileType,
                category: note.category || '',
                tags: note.tags || [],
            });
        } catch (error) {
            console.error('Error loading note:', error);
            addToast({ type: 'error', message: 'Failed to load note' });
            navigate('/dashboard/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notes' }));
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (noteData: any) => {
        setFormSubmitting(true);
        setUploadProgress(0);

        try {
            const isFileUpload = noteData instanceof FormData && noteData.get('fileType') === 'file';

            if (id) {
                if (isFileUpload) {
                    await noteAPI.uploadUpdate(id, noteData, setUploadProgress);
                } else {
                    await noteAPI.update(id, noteData);
                }
                addToast({ type: 'success', message: 'Note updated successfully!' });
            } else {
                if (isFileUpload) {
                    await noteAPI.upload(noteData, setUploadProgress);
                } else {
                    await noteAPI.create(noteData);
                }
                addToast({ type: 'success', message: 'Note created successfully!' });
            }

            // Navigate to dashboard and select notes tab
            navigate('/dashboard/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notes' }));
            }, 100);
        } catch (error: any) {
            console.error('Error saving note:', error);

            const status = error?.status || error?.response?.status;
            const isTooLarge = status === 413 ||
                String(error).includes('413') ||
                String(error?.message).includes('Too Large');

            if (isTooLarge) {
                addToast({
                    type: 'error',
                    message: '📄 File is too large for the server (max ~4MB). Please compress your PDF and try again, or contact the admin to increase the server upload limit.',
                });
            } else {
                addToast({
                    type: 'error',
                    message: error?.response?.data?.message || error?.message || 'Failed to save note. Please try again.',
                });
            }
        } finally {
            setFormSubmitting(false);
            setUploadProgress(0);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard/');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notes' }));
        }, 100);
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
                                    navigate(`${tab.path}/`);
                                    setShowMobileSidebar(false);
                                    setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: tab.id }));
                                    }, 100);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => {
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
                                    onClick={handleCancel}
                                    className="mb-4"
                                >
                                    Back to Notes
                                </Button>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {id ? 'Edit Note' : 'Create New Note'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {id ? 'Update note information and content' : 'Add a new study material for students'}
                                </p>
                            </div>

                            {/* Form */}
                            <Card className="overflow-hidden">
                                <NoteForm
                                    initialData={formInitialData}
                                    courses={courses}
                                    onSubmit={handleFormSubmit}
                                    onCancel={handleCancel}
                                    isLoading={formSubmitting}
                                    uploadProgress={uploadProgress}
                                    isFullPage={true}
                                />
                            </Card>
                            {/* Upload progress bar */}
                            {formSubmitting && uploadProgress > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <span>Uploading file...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteEditor;
