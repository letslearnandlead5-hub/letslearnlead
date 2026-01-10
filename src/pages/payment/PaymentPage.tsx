import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StudentHeader from '../../components/layout/StudentHeader';
import StudentFooter from '../../components/layout/StudentFooter';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice } from '../../utils/helpers';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getTotalPrice, clearCart } = useCartStore();
    const total = getTotalPrice();
    const [processing, setProcessing] = useState(false);
    
    const shippingAddress = location.state?.shippingAddress;

    const handlePayment = () => {
        console.log('Payment page received shipping address:', shippingAddress);
        setProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            // 80% success rate
            const success = Math.random() > 0.2;
            if (success) {
                // Generate order ID
                const orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                console.log('Passing shipping address to order tracker:', shippingAddress);
                // Clear cart on successful payment
                clearCart();
                // Navigate to order tracker with shipping address
                navigate(`/orders/${orderId}`, { state: { shippingAddress } });
            } else {
                navigate('/payment/failed');
            }
        }, 3000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <StudentHeader />
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12">
                <motion.div
                    className="container max-w-2xl mx-auto px-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text mb-2">Secure Payment</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Complete your payment to place the order
                        </p>
                    </div>

                    <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Amount to Pay</span>
                            <span className="text-3xl font-bold text-primary-600">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 border-2 border-primary-600 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-8 mx-auto" />
                            </button>
                            <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-8 mx-auto invert dark:invert-0" />
                            </button>
                        </div>

                        <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Expiry Date" placeholder="MM/YY" />
                            <Input label="CVV" placeholder="123" type="password" />
                        </div>
                        <Input label="Cardholder Name" placeholder="John Doe" />
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handlePayment}
                        isLoading={processing}
                        rightIcon={!processing ? <ArrowRight className="w-5 h-5" /> : undefined}
                    >
                        {processing ? 'Processing Payment...' : 'Pay Now'}
                    </Button>

                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span>Secure 256-bit SSL encrypted payment</span>
                    </div>
                </Card>
            </motion.div>
            </div>
            <StudentFooter />
        </div>
    );
};

export default PaymentPage;
