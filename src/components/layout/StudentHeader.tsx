import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    ShoppingCart,
    User,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useCartStore } from '../../store/useCartStore';
import { notificationAPI } from '../../services/api';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    createdAt: string;
}

const StudentHeader: React.FC = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuthStore();
    const { addToast } = useToastStore();
    const { items } = useCartStore();

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

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="px-6 h-16 flex items-center justify-between">
                {/* Left - Logo/Brand */}
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Let's L-earn and Lead"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                Lets <span className="text-yellow-500">L-Earn</span> and Lead
                            </span>
                            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 tracking-widest leading-tight">
                                LEARN EARN LEAD
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Right - Cart, Notifications & Profile */}
                <div className="flex items-center gap-4">
                    {/* Shopping Cart */}
                    <Link to="/cart" className="relative">
                        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </Link>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Notifications
                                            </h3>
                                            {unreadCount > 0 && (
                                                <Badge variant="primary">{unreadCount} new</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification._id}
                                                    className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                                                        }`}
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`p-2 rounded-lg ${notification.type === 'success'
                                                                ? 'bg-green-100 dark:bg-green-900'
                                                                : notification.type === 'warning'
                                                                    ? 'bg-yellow-100 dark:bg-yellow-900'
                                                                    : notification.type === 'error'
                                                                        ? 'bg-red-100 dark:bg-red-900'
                                                                        : 'bg-blue-100 dark:bg-blue-900'
                                                                }`}
                                                        >
                                                            <Bell className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                                                {notification.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</p>
                                                        </div>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="flex-1 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                Mark All Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            className="flex-1 text-center text-sm text-gray-600 hover:text-gray-700 font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    {/* User Profile */}
                    <Link to="/dashboard" className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
                            {user?.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user?.name || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default StudentHeader;
