import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, BookOpen, Users, ShoppingCart, FileText, MessageSquare, Brain, Settings, LogOut, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminAPI, shopAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import AdminHeader from '../../components/admin/AdminHeader';

const ProductEditor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToastStore();
    const { logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        images: '',
        category: '',
        stock: '',
    });

    // Load product data if editing
    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const response = await shopAPI.products.getById(id!);
            const product = response.data;

            setFormData({
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                originalPrice: product.originalPrice?.toString() || '',
                images: product.images.join(', '),
                category: product.category,
                stock: product.stock.toString(),
            });
        } catch (error) {
            console.error('Error loading product:', error);
            addToast({ type: 'error', message: 'Failed to load product' });
            navigate('/dashboard');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'products' }));
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitting(true);

        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                images: formData.images.split(',').map((img) => img.trim()).filter(Boolean),
                category: formData.category,
                stock: parseInt(formData.stock),
            };

            if (id) {
                await adminAPI.products.update(id, productData);
                addToast({ type: 'success', message: 'Product updated successfully!' });
            } else {
                await adminAPI.products.create(productData);
                addToast({ type: 'success', message: 'Product created successfully!' });
            }

            // Navigate to dashboard and select products tab
            navigate('/dashboard');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'products' }));
            }, 100);
        } catch (error: any) {
            console.error('Error saving product:', error);
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to save product'
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
                                            window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'products' }));
                                        }, 100);
                                    }}
                                    className="mb-4"
                                >
                                    Back to Products
                                </Button>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {id ? 'Edit Product' : 'Create New Product'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {id ? 'Update product information' : 'Add a new product to your store'}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit}>
                                <Card className="p-6 mb-6">
                                    <div className="space-y-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleFormChange}
                                                required
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="e.g., Scientific Calculator"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Description *
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleFormChange}
                                                required
                                                rows={4}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Describe the product..."
                                            />
                                        </div>

                                        {/* Price and Original Price */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Price (₹) *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleFormChange}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="999"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Original Price (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="originalPrice"
                                                    value={formData.originalPrice}
                                                    onChange={handleFormChange}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="1999"
                                                />
                                            </div>
                                        </div>

                                        {/* Category and Stock */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Category *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleFormChange}
                                                    required
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="e.g., Electronics, Stationery"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Stock *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="stock"
                                                    value={formData.stock}
                                                    onChange={handleFormChange}
                                                    required
                                                    min="0"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="50"
                                                />
                                            </div>
                                        </div>

                                        {/* Images */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Image URLs (comma-separated) *
                                            </label>
                                            <textarea
                                                name="images"
                                                value={formData.images}
                                                onChange={handleFormChange}
                                                required
                                                rows={3}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Separate multiple URLs with commas</p>
                                        </div>
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
                                                window.dispatchEvent(new CustomEvent('selectAdminTab', { detail: 'products' }));
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
                                    >
                                        {formSubmitting ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
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

export default ProductEditor;
