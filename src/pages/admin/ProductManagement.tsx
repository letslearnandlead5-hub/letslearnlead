import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, Package, DollarSign, TrendingUp, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { shopAPI, adminAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { formatPrice } from '../../utils/helpers';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    stock: number;
    rating: number;
    createdAt: string;
}

const ProductManagement: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { addToast } = useToastStore();

    useEffect(() => {
        fetchProducts();
    }, [searchTerm, selectedCategory]);

    const fetchProducts = async () => {
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCategory !== 'all') params.category = selectedCategory;

            const response = await shopAPI.products.getAll(params);
            setProducts(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            addToast({ type: 'error', message: 'Failed to load products' });
            setLoading(false);
        }
    };

    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsViewerOpen(true);
    };

    const handleCreateProduct = () => {
        navigate('/products/create');
    };

    const handleEditProduct = (product: Product) => {
        navigate(`/products/edit/${product._id}`);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            await adminAPI.products.delete(productId);
            addToast({ type: 'success', message: 'Product deleted successfully!' });
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            addToast({ type: 'error', message: 'Failed to delete product' });
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
    };

    const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);

    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
    const lowStockProducts = products.filter((p) => p.stock < 10).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your product inventory</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />} onClick={handleCreateProduct}>
                    Add New Product
                </Button>
            </div>

            {/* Search and Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(totalValue)}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockProducts}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Products Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No products found</p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="mt-4"
                                            onClick={handleCreateProduct}
                                            leftIcon={<Plus className="w-4 h-4" />}
                                        >
                                            Create First Product
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <img
                                                    src={product.images[0] || 'https://via.placeholder.com/150'}
                                                    alt={product.name}
                                                    className="w-16 h-16 rounded-lg object-cover mr-4"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {product.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatPrice(product.price)}
                                            </div>
                                            {product.originalPrice && (
                                                <div className="text-xs text-gray-500 line-through">
                                                    {formatPrice(product.originalPrice)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={product.stock < 10 ? 'danger' : 'success'}>
                                                {product.stock} units
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            ⭐ {product.rating.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewProduct(product)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Product Viewer Modal */}
            <Modal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={selectedProduct?.name || ''}
                size="xl"
            >
                {selectedProduct && (
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {selectedProduct.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`${selectedProduct.name} ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.category}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatPrice(selectedProduct.price)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Stock</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.stock} units</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    ⭐ {selectedProduct.rating.toFixed(1)}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                            <p className="text-gray-900 dark:text-white">{selectedProduct.description}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProductManagement;
