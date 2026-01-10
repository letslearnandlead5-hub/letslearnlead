import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { fetchProducts } from '../../services/mockData';
import { formatPrice } from '../../utils/helpers';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { Product } from '../../types';

const ProductsList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addItem } = useCartStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        fetchProducts().then((data) => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        addItem(product, 1);
        addToast({ type: 'success', message: `${product.name} added to cart!` });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Shop</h1>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Products */}
                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i}>
                                <Skeleton className="h-64 w-full rounded-xl" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <motion.div className="grid md:grid-cols-3 gap-6" variants={staggerContainer} initial="initial" animate="animate">
                        {filteredProducts.map((product) => (
                            <motion.div key={product.id} variants={staggerItem}>
                                <Card className="flex flex-col h-full">
                                    <img src={product.images[0]} alt={product.name} className="w-full h-64 object-cover rounded-xl mb-4" />
                                    <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.description.substring(0, 80)}...</p>
                                    <div className="mt-auto">
                                        <div className="text-2xl font-bold text-primary-600 mb-4">{formatPrice(product.price)}</div>
                                        <Button variant="primary" className="w-full" leftIcon={<ShoppingCart className="w-5 h-5" />} onClick={(e) => handleAddToCart(product, e)}>
                                            Add to Cart
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ProductsList;
