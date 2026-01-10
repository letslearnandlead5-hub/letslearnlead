import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    Package,
    CreditCard,
    X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { shopAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { formatPrice } from '../../utils/helpers';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

const StudentShop: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

    const { addToast } = useToastStore();

    const [checkoutData, setCheckoutData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        paymentMethod: 'card',
    });

    useEffect(() => {
        fetchProducts();
        loadCartFromStorage();
    }, []);

    useEffect(() => {
        saveCartToStorage();
    }, [cart]);

    const fetchProducts = async () => {
        try {
            const response = await shopAPI.products.getAll({ search: searchTerm, category: selectedCategory });
            setProducts(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            addToast({ type: 'error', message: 'Failed to load products' });
            setLoading(false);
        }
    };

    const loadCartFromStorage = () => {
        const savedCart = localStorage.getItem('student-cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    };

    const saveCartToStorage = () => {
        localStorage.setItem('student-cart', JSON.stringify(cart));
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item._id === product._id);
        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                addToast({ type: 'warning', message: 'Maximum stock reached' });
                return;
            }
            setCart(cart.map((item) =>
                item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        addToast({ type: 'success', message: 'Added to cart!' });
    };

    const updateQuantity = (productId: string, change: number) => {
        setCart(cart.map((item) => {
            if (item._id === productId) {
                const newQuantity = item.quantity + change;
                if (newQuantity <= 0) return item;
                if (newQuantity > item.stock) {
                    addToast({ type: 'warning', message: 'Maximum stock reached' });
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item._id !== productId));
        addToast({ type: 'success', message: 'Removed from cart' });
    };

    const clearCart = () => {
        setCart([]);
        addToast({ type: 'success', message: 'Cart cleared' });
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const handleCheckoutChange = (field: string, value: string) => {
        setCheckoutData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckoutSubmitting(true);

        try {
            const orderData = {
                items: cart.map((item) => ({
                    productId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingAddress: {
                    fullName: checkoutData.fullName,
                    address: checkoutData.address,
                    city: checkoutData.city,
                    state: checkoutData.state,
                    zipCode: checkoutData.zipCode,
                    phone: checkoutData.phone,
                },
                paymentMethod: checkoutData.paymentMethod,
                totalAmount: getTotalPrice(),
            };

            await shopAPI.orders.create(orderData);
            addToast({ type: 'success', message: 'Order placed successfully!' });
            clearCart();
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
        } catch (error: any) {
            console.error('Error placing order:', error);
            addToast({ type: 'error', message: error.message || 'Failed to place order' });
        } finally {
            setCheckoutSubmitting(false);
        }
    };

    const categories = Array.from(new Set(products.map((p) => p.category)));
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shop</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Browse and purchase educational materials
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        leftIcon={<ShoppingCart className="w-5 h-5" />}
                        onClick={() => setIsCartOpen(true)}
                    >
                        Cart ({getTotalItems()})
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex gap-4">
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
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Products Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Check back later for new products.
                        </p>
                    </Card>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredProducts.map((product) => (
                            <motion.div key={product._id} variants={staggerItem}>
                                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Package className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <Badge
                                                variant="danger"
                                                className="absolute top-2 right-2"
                                            >
                                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <Badge variant="secondary" className="mb-2">
                                            {product.category}
                                        </Badge>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {product.description}
                                        </p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-2xl font-bold text-primary-600">
                                                    {formatPrice(product.price)}
                                                </p>
                                                {product.originalPrice && product.originalPrice > product.price && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {formatPrice(product.originalPrice)}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={product.stock > 0 ? 'success' : 'danger'}>
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            leftIcon={<ShoppingCart className="w-4 h-4" />}
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock === 0}
                                        >
                                            Add to Cart
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Cart Modal */}
            <Modal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                title="Shopping Cart"
                size="lg"
            >
                <div className="p-6">
                    {cart.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                {cart.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                    >
                                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg flex-shrink-0">
                                            {item.images && item.images.length > 0 ? (
                                                <img
                                                    src={item.images[0]}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {item.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {formatPrice(item.price)} each
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item._id, -1)}
                                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, 1)}
                                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Total:
                                    </span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {formatPrice(getTotalPrice())}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={clearCart} className="flex-1">
                                        Clear Cart
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setIsCartOpen(false);
                                            setIsCheckoutOpen(true);
                                        }}
                                        className="flex-1"
                                        leftIcon={<CreditCard className="w-4 h-4" />}
                                    >
                                        Checkout
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Checkout Modal */}
            <Modal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                title="Checkout"
                size="lg"
            >
                <form onSubmit={handleCheckout}>
                    <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={checkoutData.fullName}
                                        onChange={(e) => handleCheckoutChange('fullName', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={checkoutData.email}
                                        onChange={(e) => handleCheckoutChange('email', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    value={checkoutData.phone}
                                    onChange={(e) => handleCheckoutChange('phone', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Address *
                                </label>
                                <textarea
                                    value={checkoutData.address}
                                    onChange={(e) => handleCheckoutChange('address', e.target.value)}
                                    required
                                    rows={2}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        value={checkoutData.city}
                                        onChange={(e) => handleCheckoutChange('city', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        value={checkoutData.state}
                                        onChange={(e) => handleCheckoutChange('state', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        ZIP Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={checkoutData.zipCode}
                                        onChange={(e) => handleCheckoutChange('zipCode', e.target.value)}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Payment Method *
                                </label>
                                <select
                                    value={checkoutData.paymentMethod}
                                    onChange={(e) => handleCheckoutChange('paymentMethod', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="cod">Cash on Delivery</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Summary</h4>
                                <div className="space-y-1 text-sm">
                                    {cart.map((item) => (
                                        <div key={item._id} className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-600 mt-2 pt-2 flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="text-primary-600">{formatPrice(getTotalPrice())}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCheckoutOpen(false)}
                            disabled={checkoutSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={checkoutSubmitting}>
                            {checkoutSubmitting ? 'Processing...' : 'Place Order'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentShop;
