import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Truck, Shield, RotateCcw, Minus, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/helpers';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { Product } from '../../types';

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const { addItem } = useCartStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        // Mock fetch product
        setTimeout(() => {
            setProduct({
                id: id || '1',
                name: 'Complete Programming Books Bundle',
                description: 'Master programming with this comprehensive bundle featuring books on JavaScript, Python, React, and more.',
                price: 2999,
                originalPrice: 4999,
                images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800'],
                category: 'Books',
                rating: 4.8,
                reviews: [],
                stock: 25,
            });
            setLoading(false);
        }, 500);
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addItem(product, quantity);
            addToast({ type: 'success', message: `Added ${quantity} item(s) to cart!` });
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12">
                        <Skeleton className="h-96 w-full rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-300 dark:text-gray-700 mb-4">
                        Product Not Found
                    </h1>
                    <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
                </div>
            </div>
        );
    }

    const images = product.images.length > 0 ? product.images : [product.images[0], product.images[0], product.images[0]];
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <motion.div
            className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 mb-12">
                    {/* Images */}
                    <div>
                        <Card className="p-4 mb-4">
                            <motion.img
                                key={selectedImage}
                                src={images[selectedImage]}
                                alt={product.name}
                                className="w-full h-96 object-cover rounded-xl"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            />
                        </Card>
                        <div className="grid grid-cols-3 gap-4">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`border-2 rounded-lg overflow-hidden transition-all ${selectedImage === idx
                                            ? 'border-primary-600 ring-2 ring-primary-200'
                                            : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-24 object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-4">
                            <Badge variant="primary">{product.category}</Badge>
                            {discount > 0 && (
                                <Badge variant="success" className="ml-2">
                                    {discount}% OFF
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${i < Math.floor(product.rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                                <span className="ml-2 font-semibold">{product.rating}</span>
                            </div>
                            <span className="text-gray-500">({product.reviews.length} reviews)</span>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-4xl font-bold text-primary-600">
                                    {formatPrice(product.price)}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-2xl text-gray-500 line-through">
                                        {formatPrice(product.originalPrice)}
                                    </span>
                                )}
                            </div>
                            <p className="text-green-600 font-semibold">
                                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                            </p>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Quantity Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">Quantity</label>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                                    disabled={quantity >= (product.stock || 99)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mb-8">
                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-1"
                                onClick={handleBuyNow}
                                leftIcon={<ShoppingCart className="w-5 h-5" />}
                                disabled={product.stock === 0}
                            >
                                Buy Now
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                className="flex-1"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                Add to Cart
                            </Button>
                            <Button variant="outline" size="lg">
                                <Heart className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="p-4 text-center">
                                <Truck className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                                <p className="text-sm font-semibold">Free Shipping</p>
                                <p className="text-xs text-gray-500">On orders above ₹500</p>
                            </Card>
                            <Card className="p-4 text-center">
                                <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                <p className="text-sm font-semibold">Secure Payment</p>
                                <p className="text-xs text-gray-500">100% Protected</p>
                            </Card>
                            <Card className="p-4 text-center">
                                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-semibold">Easy Returns</p>
                                <p className="text-xs text-gray-500">7 Days Return</p>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Product Details */}
                <Card className="p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-4">Product Details</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">What's Included:</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• JavaScript: The Definitive Guide</li>
                                <li>• Python Crash Course</li>
                                <li>• React Handbook</li>
                                <li>• Clean Code by Robert Martin</li>
                                <li>• Design Patterns</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Specifications:</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Format: Physical Books</li>
                                <li>• Language: English</li>
                                <li>• Publisher: Tech Books Ltd</li>
                                <li>• Weight: 3.5 kg</li>
                                <li>• Dimensions: 30 x 25 x 15 cm</li>
                            </ul>
                        </div>
                    </div>
                </Card>

                {/* Reviews */}
                <Card className="p-8">
                    <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
                    <div className="space-y-6">
                        {[1, 2, 3].map((review) => (
                            <div key={review} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                                        U{review}
                                    </div>
                                    <div>
                                        <p className="font-semibold">User {review}</p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Excellent quality books! The content is comprehensive and well-organized. Highly
                                    recommended for anyone learning programming.
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default ProductDetails;
