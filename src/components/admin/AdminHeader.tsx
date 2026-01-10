import React from 'react';
import { User, Moon, Sun, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* Left - Mobile Menu Button + Logo */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo and Brand */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <img
                            src="/logo.png"
                            alt="Let's L-earn and Lead"
                            className="h-12 w-auto object-contain flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                                Lets <span className="text-yellow-500">L-Earn</span> and Lead
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-yellow-600 dark:text-yellow-500 tracking-wider leading-tight">
                                LEARN EARN LEAD
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center - Admin Panel Title */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Admin Panel
                    </h2>
                </div>

                {/* Right - Actions & User Info */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                                {user?.name || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
