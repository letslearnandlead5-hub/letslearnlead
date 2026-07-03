import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Moon,
    Sun,
    Menu,
    BookOpen,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    Home as HomeIcon,
    Info,
    Mail,
    FileText,
    HelpCircle,
    FileQuestion,
    User,
    CreditCard,
    Brain,
    BookmarkCheck,
    Award,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import Button from '../ui/Button';

/** Returns the 1-2 uppercase initials from a full name */
const getInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Deterministic gradient from a string (name) */
const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-amber-600',
        'from-pink-500 to-rose-600',
        'from-cyan-500 to-blue-600',
    ];
    const idx = (name?.charCodeAt(0) ?? 0) % gradients.length;
    return gradients[idx];
};

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
        navigate('/');
    };

    const goToDashboardTab = (tab: string) => {
        setShowUserMenu(false);
        setShowMobileMenu(false);
        navigate(`/dashboard/?tab=${tab}`);
    };

    const avatarGradient = user ? getAvatarGradient(user.name) : '';
    const initials = user ? getInitials(user.name) : '';

    /** Student quick-links shown in the profile dropdown */
    const studentLinks = [
        { tab: 'profile', label: 'My Profile', icon: User },
        { tab: 'courses', label: 'My Courses', icon: BookOpen },
        { tab: 'payments', label: 'My Payments', icon: CreditCard },
        { tab: 'doubts', label: 'My Doubts', icon: HelpCircle },
        { tab: 'quizzes', label: 'My Quizzes', icon: Brain },
        { tab: 'my-notes', label: 'Notes Library', icon: BookmarkCheck },
        { tab: 'certificates', label: 'Certificates', icon: Award },
    ];

    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                        <img
                            src={isDark ? "/logo_black.png" : "/logo.png?v=2"}
                            alt="Let's L-Earn and Lead"
                            className="h-16 sm:h-20 w-auto flex-shrink-0 -my-2"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
                                Lets <span className="text-yellow-600">L-Earn</span> and Lead
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-yellow-600 dark:text-yellow-500 tracking-wider sm:tracking-widest leading-tight whitespace-nowrap">
                                LEARN EARN LEAD
                            </span>
                        </div>
                    </Link>

                    {/* Navigation - Role Based */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {/* Common Links for All Users */}
                        <Link
                            to="/"
                            className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <HomeIcon className="w-4 h-4" />
                            <span>Home</span>
                        </Link>

                        <Link
                            to="/about"
                            className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <Info className="w-4 h-4" />
                            <span>About Us</span>
                        </Link>

                        {/* Role-Based Links */}
                        {user?.role === 'admin' ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    to="/courses"
                                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span>Manage Courses</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/courses"
                                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span>Courses</span>
                                </Link>
                            </>
                        )}


                        {/* Common Links for All Users */}
                        <Link
                            to="/contact"
                            className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Contact</span>
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center space-x-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* User Avatar + Dropdown */}
                        {isAuthenticated ? (
                            <div className="relative" ref={userMenuRef}>
                                {/* Avatar button */}
                                <button
                                    id="profile-avatar-btn"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all"
                                    aria-label="Open profile menu"
                                >
                                    {user?.profilePicture || user?.avatar ? (
                                        <img
                                            src={user.profilePicture || user.avatar}
                                            alt={user.name}
                                            className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
                                        />
                                    ) : (
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white dark:ring-gray-800 select-none`}>
                                            {initials}
                                        </div>
                                    )}
                                    <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Rich dropdown panel */}
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                                        >
                                            {/* User info header */}
                                            <div className={`bg-gradient-to-r ${avatarGradient} p-4`}>
                                                <div className="flex items-center space-x-3">
                                                    {user?.profilePicture || user?.avatar ? (
                                                        <img
                                                            src={user.profilePicture || user.avatar}
                                                            alt={user?.name}
                                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold select-none">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-white truncate">{user?.name}</p>
                                                        <p className="text-xs text-white/75 truncate">{user?.email}</p>
                                                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-white/20 text-white rounded-full capitalize">
                                                            🎓 {user?.role === 'admin' ? 'Admin' : 'Student'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick links - only for students */}
                                            {user?.role !== 'admin' && (
                                                <div className="py-2">
                                                    {studentLinks.map(({ tab, label, icon: Icon }) => (
                                                        <button
                                                            key={tab}
                                                            onClick={() => goToDashboardTab(tab)}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
                                                        >
                                                            <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                                            <span>{label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Go to Dashboard */}
                                            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                                                <button
                                                    onClick={() => { setShowUserMenu(false); navigate('/dashboard/'); }}
                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 flex items-center space-x-3 transition-colors"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                                                    <span>{user?.role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Student Dashboard'}</span>
                                                </button>
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4 flex-shrink-0" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login/')}>
                                    Login
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => navigate('/signup/')}>
                                    Sign Up
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {showMobileMenu && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4"
                        >
                            <nav className="flex flex-col space-y-1">
                                <Link
                                    to="/"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span>Home</span>
                                </Link>

                                <Link
                                    to="/about"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <Info className="w-4 h-4" />
                                    <span>About Us</span>
                                </Link>

                                {user?.role === 'admin' ? (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link
                                            to="/courses"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            <span>Manage Courses</span>
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        to="/courses"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        <span>Courses</span>
                                    </Link>
                                )}

                                {/* My Learning Section - Mobile */}
                                {isAuthenticated && user?.role !== 'admin' && (
                                    <>
                                        <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            My Learning
                                        </div>
                                        {studentLinks.map(({ tab, label, icon: Icon }) => (
                                            <button
                                                key={tab}
                                                onClick={() => goToDashboardTab(tab)}
                                                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full text-left"
                                            >
                                                <Icon className="w-4 h-4 text-primary-500" />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </>
                                )}

                                <Link
                                    to="/contact"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>Contact</span>
                                </Link>

                                {isAuthenticated ? (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                                        <button
                                            onClick={() => { setShowMobileMenu(false); navigate('/dashboard/'); }}
                                            className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full text-left"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                                            className="flex items-center space-x-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                                        <button
                                            onClick={() => { setShowMobileMenu(false); navigate('/login/'); }}
                                            className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full text-left"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => { setShowMobileMenu(false); navigate('/signup/'); }}
                                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full text-left"
                                        >
                                            Sign Up
                                        </button>
                                    </>
                                )}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Header;
