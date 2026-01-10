import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Moon,
    Sun,
    Menu,
    BookOpen,
    ShoppingBag,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    Home as HomeIcon,
    Info,
    Mail,
    FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import Button from '../ui/Button';

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                        <img
                            src="/logo.png"
                            alt="Let's L-Earn and Lead"
                            className="h-8 sm:h-10 w-auto flex-shrink-0"
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

                                <Link
                                    to="/shop"
                                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Shop</span>
                                </Link>
                            </>
                        )}



                        {/* Notes Link - For Students to View */}
                        {isAuthenticated && user?.role !== 'admin' && (
                            <Link
                                to="/notes"
                                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Notes</span>
                            </Link>
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
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* User Menu with Dropdown */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                                        >
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    navigate('/dashboard');
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                <span>Dashboard</span>
                                            </button>
                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                                    Login
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                                    Sign Up
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu */}
                        <button 
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-400"
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
                            <nav className="flex flex-col space-y-2">
                                <Link
                                    to="/"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span>Home</span>
                                </Link>

                                <Link
                                    to="/about"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <Info className="w-4 h-4" />
                                    <span>About Us</span>
                                </Link>

                                {user?.role === 'admin' ? (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link
                                            to="/courses"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            <span>Manage Courses</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/courses"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            <span>Courses</span>
                                        </Link>

                                        <Link
                                            to="/shop"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            <span>Shop</span>
                                        </Link>
                                    </>
                                )}

                                {isAuthenticated && user?.role !== 'admin' && (
                                    <Link
                                        to="/notes"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Notes</span>
                                    </Link>
                                )}

                                <Link
                                    to="/contact"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>Contact</span>
                                </Link>

                                {isAuthenticated ? (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                navigate('/login');
                                            }}
                                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full text-left"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                navigate('/signup');
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full text-left"
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
