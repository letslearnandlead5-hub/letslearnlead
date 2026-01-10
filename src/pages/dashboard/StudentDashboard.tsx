import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    BookOpen,
    Award,
    ShoppingCart,
    User,
    LogOut,
    Bell,
    MessageSquare,
    Menu,
    X,
    Brain,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import StudentHeader from '../../components/layout/StudentHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useCartStore } from '../../store/useCartStore';
import { notificationAPI } from '../../services/api';
import MyCourses from '../courses/MyCourses';
import MyPurchases from '../purchases/MyPurchases';
import MyProfile from '../profile/MyProfile';
import MyCertificates from '../certificates/MyCertificates';
import MyDoubts from '../doubts/MyDoubts';
import MyQuizzes from '../quizzes/MyQuizzes';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    createdAt: string;
}

const StudentDashboard: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState('courses');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { logout, user } = useAuthStore();
    const { addToast } = useToastStore();
    const { items } = useCartStore();
    const navigate = useNavigate();

    const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response: any = await notificationAPI.getAll({ limit: 20 });
            setNotifications(response.data || []);
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        addToast({ type: 'success', message: 'Logged out successfully!' });
        navigate('/login');
        setShowLogoutModal(false);
    };

    const tabs = [
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'quizzes', label: 'My Quizzes', icon: Brain },
        { id: 'purchases', label: 'My Purchases', icon: ShoppingCart },
        { id: 'doubts', label: 'My Doubts', icon: MessageSquare },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'certificates', label: 'Certificates', icon: Award },
    ];



    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
            // Update local state
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            addToast({ type: 'success', message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Error marking all as read:', error);
            addToast({ type: 'error', message: 'Failed to mark notifications as read' });
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <StudentHeader />

            <div className="flex">
                {/* Sidebar Navigation - Hidden on mobile, visible on lg+ */}
                <div className={`fixed lg:sticky top-16 inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${
                    showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                    <div className="p-6 flex-shrink-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setSelectedTab(tab.id);
                                    setShowMobileSidebar(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${selectedTab === tab.id
                                    ? 'bg-primary-100 dark:bg-primary-950 text-primary-600'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
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
                <div className="flex-1 min-h-[calc(100vh-64px)] overflow-y-auto">
                    {selectedTab === 'courses' && <MyCourses />}

                    {selectedTab === 'quizzes' && <MyQuizzes />}

                    {selectedTab === 'purchases' && <MyPurchases />}

                    {selectedTab === 'doubts' && <MyDoubts />}

                    {selectedTab === 'profile' && <MyProfile />}

                    {selectedTab === 'certificates' && <MyCertificates />}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Confirm Logout"
                size="sm"
            >
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        Are you sure you want to logout?
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={confirmLogout} className="bg-red-600 hover:bg-red-700">
                            Logout
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentDashboard;
