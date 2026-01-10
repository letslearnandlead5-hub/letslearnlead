import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StudentHeader from '../../components/layout/StudentHeader';
import StudentFooter from '../../components/layout/StudentFooter';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice } from '../../utils/helpers';
import { staggerContainer, staggerItem } from '../../utils/animations';

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
    const total = getTotalPrice();

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <StudentHeader />
                <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                    <div className="text-center">
                        <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h2 className="text-3xl font-bold text-gray-400 dark:text-gray-600 mb-4">
                            Your cart is empty
                        </h2>
                        <Button variant="primary" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
                <StudentFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <StudentHeader />
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold gradient-text mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <motion.div
                        className="lg:col-span-2 space-y-4"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        {items.map((item) => (
                            <motion.div key={item.productId} variants={staggerItem}>
                                <Card className="p-6">
                                    <div className="flex gap-6">
                                        <img
                                            src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                                            alt={item.product?.name || 'Product'}
                                            className="w-32 h-32 object-cover rounded-xl bg-gray-200 dark:bg-gray-700"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://via.placeholder.com/150?text=Product';
                                            }}
                                        />

                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">{item.product?.name || 'Product'}</h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                                {item.product?.description || 'No description available'}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                Math.max(1, item.quantity - 1)
                                                            )
                                                        }
                                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-semibold w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.productId, item.quantity + 1)
                                                        }
                                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl font-bold text-primary-600">
                                                        {formatPrice((item.product?.price || 0) * item.quantity)}
                                                    </span>
                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20 p-6">
                            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span className="text-primary-600">{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mb-3"
                                rightIcon={<ArrowRight className="w-5 h-5" />}
                                onClick={() => navigate('/checkout')}
                            >
                                Proceed to Checkout
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                        </Card>
                    </div>
                </div>
                </div>
            </div>
            <StudentFooter />
        </div>
    );
};

export default Cart;
