import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Trash2, Send, Users, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { notificationAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    recipientType: 'all' | 'specific';
    userId?: string;
    read: boolean;
    createdAt: string;
}

const NotificationManagement: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response: any = await notificationAPI.getAll({ limit: 100 });
            setNotifications(response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            addToast({ type: 'error', message: 'Failed to load notifications' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }

        try {
            await notificationAPI.delete(id);
            addToast({ type: 'success', message: 'Notification deleted successfully' });
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            addToast({ type: 'error', message: 'Failed to delete notification' });
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900';
            case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
            case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900';
            default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Notification Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create and manage notifications for students
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/notifications/create')}
                    leftIcon={<Plus className="w-5 h-5" />}
                >
                    Send Notification
                </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sent</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notifications.length}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Broadcast</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notifications.filter(n => n.recipientType === 'all').length}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Individual</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notifications.filter(n => n.recipientType === 'specific').length}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Send className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Read Rate</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {notifications.length > 0
                                    ? Math.round((notifications.filter(n => n.read).length / notifications.length) * 100)
                                    : 0}%
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Notifications List */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Notifications
                </h2>

                {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No notifications sent yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                                    <Bell className="w-5 h-5" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteNotification(notification._id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant={notification.type === 'info' ? 'primary' : notification.type === 'success' ? 'success' : 'warning'}>
                                            {notification.type}
                                        </Badge>
                                        <Badge variant={notification.recipientType === 'all' ? 'secondary' : 'primary'}>
                                            {notification.recipientType === 'all' ? (
                                                <><Users className="w-3 h-3 mr-1 inline" /> All Users</>
                                            ) : (
                                                <><User className="w-3 h-3 mr-1 inline" /> Individual</>
                                            )}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                            {new Date(notification.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default NotificationManagement;
