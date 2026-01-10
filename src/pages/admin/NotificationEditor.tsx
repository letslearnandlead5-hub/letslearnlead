import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, BookOpen, Users, ShoppingCart, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp, Send } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { notificationAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import AdminHeader from '../../components/admin/AdminHeader';

const NotificationEditor: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const { logout } = useAuthStore();
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        recipientType: 'all' as 'all' | 'specific',
        userId: '',
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            addToast({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }

        setFormSubmitting(true);

        try {
            await notificationAPI.create({
                title: formData.title,
                message: formData.message,
                type: formData.type,
                recipientType: formData.recipientType,
                userId: formData.recipientType === 'specific' ? formData.userId : undefined,
            });

            addToast({ type: 'success', message: 'Notification sent successfully!' });

            // Navigate to dashboard and select notifications tab
            navigate('/dashboard');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notifications' }));
            }, 100);
        } catch (error: any) {
            console.error('Error sending notification:', error);
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to send notification'
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
                                        setTimeout(() => {
                                            window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notifications' }));
                                        }, 100);
                                    }}
                                    className="mb-4"
                                >
                                    Back to Notifications
                                </Button>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Send New Notification
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Create and send notifications to users
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit}>
                                <Card className="p-6 mb-6">
                                    <div className="space-y-6">
                                        {/* Title */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Title *
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleFormChange}
                                                required
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Enter notification title"
                                            />
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Message *
                                            </label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleFormChange}
                                                required
                                                rows={6}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Enter notification message"
                                            />
                                        </div>

                                        {/* Type and Recipient Type */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Type
                                                </label>
                                                <select
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="info">Info</option>
                                                    <option value="success">Success</option>
                                                    <option value="warning">Warning</option>
                                                    <option value="error">Error</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Send To
                                                </label>
                                                <select
                                                    name="recipientType"
                                                    value={formData.recipientType}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="all">All Users</option>
                                                    <option value="specific">Specific User</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* User ID (conditional) */}
                                        {formData.recipientType === 'specific' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    User ID
                                                </label>
                                                <input
                                                    type="text"
                                                    name="userId"
                                                    value={formData.userId}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Enter user ID"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            navigate('/dashboard');
                                            setTimeout(() => {
                                                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'notifications' }));
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
                                        leftIcon={<Send className="w-4 h-4" />}
                                    >
                                        {formSubmitting ? 'Sending...' : 'Send Notification'}
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

export default NotificationEditor;
