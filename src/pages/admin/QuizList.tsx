import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    BookOpen,
    BarChart3,
    Users,
    ShoppingCart,
    FileText,
    Settings,
    LogOut,
    MessageSquare,
    FileQuestion,
    Brain,
    X,
} from 'lucide-react';
import { getAllQuizzes, deleteQuiz, publishQuiz } from '../../services/quizService';
import type { Quiz } from '../../types';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import AdminHeader from '../../components/admin/AdminHeader';

const QuizList: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'products', label: 'Products', icon: ShoppingCart },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
        { id: 'doubts', label: 'Student Doubts', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Brain },
    ];

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('You must be logged in as an admin to access this page');
            navigate('/login');
            return;
        }
        fetchQuizzes();
    }, [filter, user, navigate]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const filters = filter === 'all' ? {} : { isPublished: filter === 'published' };
            const data = await getAllQuizzes(filters);
            setQuizzes(data);
        } catch (error: any) {
            console.error('Quiz fetch error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load quizzes';
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (quizId: string) => {
        try {
            await deleteQuiz(quizId);
            toast.success('Quiz deleted successfully');
            fetchQuizzes();
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete quiz');
        }
    };

    const handleTogglePublish = async (quiz: Quiz) => {
        try {
            await publishQuiz(quiz._id || quiz.id || '', !quiz.isPublished);
            toast.success(
                quiz.isPublished ? 'Quiz unpublished successfully' : 'Quiz published successfully'
            );
            fetchQuizzes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update quiz');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
                <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    const filteredQuizzes = quizzes.filter((quiz) => {
        if (filter === 'all') return true;
        if (filter === 'published') return quiz.isPublished;
        if (filter === 'draft') return !quiz.isPublished;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminHeader onMenuClick={() => setShowMobileSidebar(true)} />
            
            <div className="flex">
                <div className={`fixed lg:sticky top-20 inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 lg:hidden">
                        <div className="flex items-center justify-end">
                            <button onClick={() => setShowMobileSidebar(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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
                                        setShowMobileSidebar(false);
                                    } else {
                                        // Dispatch custom event to switch tab in AdminDashboard
                                        window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: tab.id }));
                                        navigate('/dashboard');
                                        setShowMobileSidebar(false);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${tab.id === 'quizzes' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                        <button onClick={() => { 
                            window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'settings' }));
                            navigate('/dashboard'); 
                            setShowMobileSidebar(false); 
                        }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-6 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Settings</span>
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </nav>
                </div>

                {showMobileSidebar && (
                    <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowMobileSidebar(false)}></div>
                )}

                <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Management</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Create and manage quizzes for your courses</p>
                                </div>
                                <button onClick={() => navigate('/admin/quizzes/new')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                    <Plus className="w-5 h-5" />
                                    Create Quiz
                                </button>
                            </div>

                            <div className="mb-6 flex gap-2">
                                {['all', 'published', 'draft'].map((filterOption) => (
                                    <button key={filterOption} onClick={() => setFilter(filterOption as any)} className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${filter === filterOption ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                        {filterOption}
                                    </button>
                                ))}
                            </div>

                            {filteredQuizzes.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No quizzes found</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first quiz</p>
                                    <button onClick={() => navigate('/admin/quizzes/new')} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                        <Plus className="w-5 h-5" />
                                        Create Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quiz</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Questions</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Limit</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredQuizzes.map((quiz, index) => (
                                                    <motion.tr key={quiz._id || quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{quiz.title}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{quiz.description}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">{quiz.courseName || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                                                <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                                                                {quiz.totalQuestions || quiz.questions?.length || 0}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {quiz.isPublished ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Published
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                                    <XCircle className="w-3 h-3" />
                                                                    Draft
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">{quiz.settings?.timeLimit || 'N/A'} {quiz.settings?.timeLimit ? 'min' : ''}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => navigate(`/admin/quizzes/${quiz._id || quiz.id}/results`)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300" title="View Results">
                                                                    <BarChart3 className="w-5 h-5" />
                                                                </button>
                                                                <button onClick={() => navigate(`/admin/quizzes/edit/${quiz._id || quiz.id}`)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" title="Edit">
                                                                    <Edit className="w-5 h-5" />
                                                                </button>
                                                                <button onClick={() => handleTogglePublish(quiz)} className={`${quiz.isPublished ? 'text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'}`} title={quiz.isPublished ? 'Unpublish' : 'Publish'}>
                                                                    {quiz.isPublished ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm(quiz._id || quiz.id || '')} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" title="Delete">
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Quiz?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">This will permanently delete the quiz and all associated attempts and results. This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default QuizList;
