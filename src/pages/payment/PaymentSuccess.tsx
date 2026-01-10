import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { CheckCircle, Home, Package } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useCartStore } from '../../store/useCartStore';

const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { clearCart } = useCartStore();
    const [showConfetti, setShowConfetti] = React.useState(true);

    useEffect(() => {
        // Clear cart on successful payment
        clearCart();
        // Stop confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
    }, [clearCart]);

    const orderNumber = `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <motion.div
                className="container max-w-2xl mx-auto px-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mb-6"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-20 h-20 text-white" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h1 className="text-4xl font-bold text-green-600 mb-4">
                            Payment Successful!
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                            Your order has been placed successfully
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
                            <p className="text-sm text-gray-500 mb-2">Order Number</p>
                            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
                        </div>

                        <div className="space-y-4 text-left mb-8">
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-semibold">Payment Confirmed</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        We've received your payment
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                                <div>
                                    <p className="font-semibold">Order Processing</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Your order is being prepared for shipment
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                className="flex-1"
                                onClick={() => navigate('/orders/' + orderNumber)}
                                leftIcon={<Package className="w-5 h-5" />}
                            >
                                Track Order
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1"
                                onClick={() => navigate('/')}
                                leftIcon={<Home className="w-5 h-5" />}
                            >
                                Go Home
                            </Button>
                        </div>
                    </motion.div>
                </Card>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
