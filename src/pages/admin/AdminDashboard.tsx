import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BookOpen,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    FileText,
    Settings,
    Brain,
    LogOut,
    MessageSquare,
    Menu,
    X,
    FileQuestion,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { formatPrice } from '../../utils/helpers';
import UserManagement from './UserManagement';
import OrderManagement from './OrderManagement';
import NotesManagement from './NotesManagement';
import CourseManagement from './CourseManagement';
import StudentManagement from './StudentManagement';
import ProductManagement from './ProductManagement';
import NotificationManagement from './NotificationManagement';
import DoubtManagement from './DoubtManagement';
import AdminHeader from '../../components/admin/AdminHeader';
import { adminAPI, settingsAPI } from '../../services/api';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useToastStore } from '../../store/useToastStore';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';

// TypeScript Interfaces
interface StatItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    change: string;
    color: string;
}

interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface CategoryDataItem {
    name: string;
    value: number;
    [key: string]: any; // Required for Recharts compatibility
}

interface DashboardStats {
    stats?: {
        totalUsers: number;
        totalCourses: number;
        totalOrders: number;
        totalRevenue: number;
    };
    revenueData?: Array<{ month: string; revenue: number }>;
    courseData?: Array<{ name: string; students: number }>;
    categoryData?: CategoryDataItem[];
    recentOrders?: any[];
}

const AdminDashboard: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const { logout, user, updateUser } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const { addToast } = useToastStore();
    const navigate = useNavigate();

    // Settings state
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    
    // Platform settings state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [userRegistration, setUserRegistration] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(false);

    useEffect(() => {
        if (selectedTab === 'overview') {
            fetchDashboardData();
        } else if (selectedTab === 'settings') {
            fetchPlatformSettings();
        }
    }, [selectedTab]);

    // Listen for tab selection events from other pages
    useEffect(() => {
        const handleTabSelection = (event: CustomEvent) => {
            setSelectedTab(event.detail);
        };
        window.addEventListener('selectAdminTab', handleTabSelection as EventListener);
        return () => {
            window.removeEventListener('selectAdminTab', handleTabSelection as EventListener);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await adminAPI.analytics.overview();
            setDashboardStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchPlatformSettings = async () => {
        try {
            const response: any = await settingsAPI.get();
            const settings = response.data;
            console.log('Loaded platform settings:', settings);
            setEmailNotifications(settings.emailNotifications);
            setMaintenanceMode(settings.maintenanceMode);
            setUserRegistration(settings.userRegistration);
        } catch (error) {
            console.error('Error fetching platform settings:', error);
            addToast({ type: 'error', message: 'Failed to load platform settings' });
        }
    };

    const updatePlatformSetting = async (setting: string, value: boolean) => {
        try {
            setLoadingSettings(true);
            console.log(`Updating ${setting} to ${value}`);
            await settingsAPI.update({ [setting]: value });
            console.log(`Successfully updated ${setting}`);
            addToast({ type: 'success', message: 'Setting updated successfully!' });
        } catch (error: any) {
            console.error('Error updating setting:', error);
            addToast({ type: 'error', message: error.message || 'Failed to update setting' });
            // Revert the change
            if (setting === 'emailNotifications') setEmailNotifications(!value);
            if (setting === 'maintenanceMode') setMaintenanceMode(!value);
            if (setting === 'userRegistration') setUserRegistration(!value);
        } finally {
            setLoadingSettings(false);
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

    const handleSaveProfile = async () => {
        if (!profileName || !profileEmail) {
            addToast({ type: 'error', message: 'Please fill in all fields' });
            return;
        }

        try {
            setSavingProfile(true);
            const response: any = await api.put('/auth/profile', {
                name: profileName,
                email: profileEmail,
            });

            updateUser(response.user);
            addToast({ type: 'success', message: 'Profile updated successfully!' });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            addToast({ type: 'error', message: error.message || 'Failed to update profile' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            addToast({ type: 'error', message: 'Please fill in all password fields' });
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            addToast({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setChangingPassword(true);
            await api.put('/auth/change-password', {
                currentPassword,
                newPassword,
            });

            addToast({ type: 'success', message: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            addToast({ type: 'error', message: error.message || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    const stats: StatItem[] = [
        {
            icon: Users,
            label: 'Total Users',
            value: dashboardStats?.stats?.totalUsers || 0,
            change: '+12%',
            color: 'bg-blue-500'
        },
        {
            icon: BookOpen,
            label: 'Active Courses',
            value: dashboardStats?.stats?.totalCourses || 0,
            change: '+5%',
            color: 'bg-green-500'
        },
        {
            icon: ShoppingCart,
            label: 'Total Orders',
            value: dashboardStats?.stats?.totalOrders || 0,
            change: '+18%',
            color: 'bg-purple-500'
        },
        {
            icon: DollarSign,
            label: 'Revenue',
            value: `₹${(dashboardStats?.stats?.totalRevenue || 0).toLocaleString()}`,
            change: '+23%',
            color: 'bg-yellow-500'
        },
    ];

    // Real data from API
    const revenueData = dashboardStats?.revenueData || [];
    const courseData = dashboardStats?.courseData || [];
    const categoryData: CategoryDataItem[] = dashboardStats?.categoryData || [];

    const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#f59e0b'];

    const recentOrders = dashboardStats?.recentOrders || [];

    const tabs: TabItem[] = [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'users', label: 'All Users', icon: Users },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'products', label: 'Products', icon: ShoppingCart },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
        { id: 'doubts', label: 'Student Doubts', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Brain },
    ];

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
                                    if (tab.id === 'quizzes') {
                                        navigate('/admin/quizzes');
                                    } else {
                                        setSelectedTab(tab.id);
                                        setShowMobileSidebar(false);
                                    }
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
                            onClick={() => {
                                setSelectedTab('settings');
                                setShowMobileSidebar(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 ${selectedTab === 'settings'
                                ? 'bg-primary-100 dark:bg-primary-950 text-primary-600'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
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
                        {selectedTab === 'overview' && (
                            <>
                                {/* Stats Grid */}
                                <motion.div
                                    variants={staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                                >
                                    {stats.map((stat, index) => (
                                        <motion.div key={index} variants={staggerItem}>
                                            <Card className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`${stat.color} p-3 rounded-xl`}>
                                                        <stat.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <Badge variant="success">{stat.change}</Badge>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                                    {/* Revenue Chart */}
                                    <Card className="p-6">
                                        <h3 className="text-xl font-bold mb-4">Revenue Overview</h3>
                                        {revenueData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={revenueData}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                No revenue data available
                                            </div>
                                        )}
                                    </Card>

                                    {/* Course Popularity */}
                                    <Card className="p-6">
                                        <h3 className="text-xl font-bold mb-4">Popular Courses</h3>
                                        {courseData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={courseData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="students" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                No course data available
                                            </div>
                                        )}
                                    </Card>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-6">
                                    {/* Category Distribution */}
                                    <Card className="p-6">
                                        <h3 className="text-xl font-bold mb-4">Categories</h3>
                                        {categoryData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={(entry) => entry.name}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {categoryData.map((_entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                No category data available
                                            </div>
                                        )}
                                    </Card>

                                    {/* Recent Orders */}
                                    <Card className="p-6 lg:col-span-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold">Recent Orders</h3>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedTab('orders')}>View All</Button>
                                        </div>
                                        <div className="space-y-3">
                                            {recentOrders.slice(0, 3).map((order: any) => (
                                                <div
                                                    key={order._id}
                                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                                >
                                                    <div>
                                                        <p className="font-semibold">{order.orderId}</p>
                                                        <p className="text-sm text-gray-500">{order.userId?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold">{formatPrice(order.totalAmount)}</p>
                                                        <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}

                        {selectedTab === 'students' && <StudentManagement />}
                        {selectedTab === 'users' && <UserManagement />}
                        {selectedTab === 'orders' && <OrderManagement />}

                        {selectedTab === 'courses' && <CourseManagement />}

                        {selectedTab === 'products' && <ProductManagement />}

                        {selectedTab === 'notes' && <NotesManagement />}

                        {selectedTab === 'settings' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
                                <div className="grid gap-6">
                                    {/* Profile Settings */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Profile Settings
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Admin Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={profileEmail}
                                                    onChange={(e) => setProfileEmail(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="admin@example.com"
                                                />
                                            </div>
                                            <Button 
                                                variant="primary" 
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                            >
                                                {savingProfile ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </Card>

                                    {/* Appearance Settings */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Appearance
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Enable dark mode for the admin panel
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={isDark}
                                                        onChange={toggleTheme}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Platform Settings */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Platform Settings
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        Email Notifications
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Receive email notifications for new orders and users
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={emailNotifications}
                                                        onChange={(e) => {
                                                            setEmailNotifications(e.target.checked);
                                                            updatePlatformSetting('emailNotifications', e.target.checked);
                                                        }}
                                                        disabled={loadingSettings}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        Maintenance Mode
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Put the platform in maintenance mode
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={maintenanceMode}
                                                        onChange={(e) => {
                                                            setMaintenanceMode(e.target.checked);
                                                            updatePlatformSetting('maintenanceMode', e.target.checked);
                                                        }}
                                                        disabled={loadingSettings}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        User Registration
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Allow new users to register
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={userRegistration}
                                                        onChange={(e) => {
                                                            setUserRegistration(e.target.checked);
                                                            updatePlatformSetting('userRegistration', e.target.checked);
                                                        }}
                                                        disabled={loadingSettings}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Security Settings */}
                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Security Settings
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Change Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                                                    placeholder="Current password"
                                                />
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                                                    placeholder="New password"
                                                />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                            <Button 
                                                variant="primary"
                                                onClick={handleChangePassword}
                                                disabled={changingPassword}
                                            >
                                                {changingPassword ? 'Updating...' : 'Update Password'}
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {selectedTab === 'doubts' && <DoubtManagement />}

                        {selectedTab === 'notifications' && <NotificationManagement />}
                    </div>
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
                        Are you sure you want to logout from the admin panel?
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

export default AdminDashboard;
