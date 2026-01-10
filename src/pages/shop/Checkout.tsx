import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, MapPin, Package, ArrowRight, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice } from '../../utils/helpers';
import { shopAPI } from '../../services/api';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { items, getTotalPrice, clearCart } = useCartStore();
    const total = getTotalPrice();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Shipping
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        // Payment
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
    });

    const steps = [
        { id: 1, name: 'Shipping', icon: MapPin },
        { id: 2, name: 'Payment', icon: CreditCard },
        { id: 3, name: 'Review', icon: Package },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Place order with Razorpay payment
            handlePayment();
        }
    };

    const handlePayment = async () => {
        try {
            const shippingData = {
                name: formData.fullName,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.pincode,
                phone: formData.phone,
            };

            // Create Razorpay order
            const orderResponse: any = await shopAPI.payment.createOrder({
                items: items.map(item => ({
                    productId: item.productId,
                    product: item.product,
                    quantity: item.quantity,
                })),
                shippingAddress: shippingData,
                totalAmount: total,
            });

            const { orderId, amount, currency, keyId, dbOrderId } = orderResponse.data;

            // Initialize Razorpay
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "Let's L-Earn and Lead",
                description: 'Shop Order Payment',
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        // Verify payment
                        await shopAPI.payment.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            dbOrderId,
                        });

                        // Clear cart and redirect to success page
                        clearCart();
                        navigate('/payment/success', {
                            state: { orderId: dbOrderId, amount: total },
                        });
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        navigate('/payment/failed');
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: {
                    color: '#3b82f6',
                },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to initiate payment. Please try again.');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (items.length === 0) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12">
                    <Card className="p-8 text-center max-w-md">
                        <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Add some products to your cart before checkout
                        </p>
                        <Button onClick={() => navigate('/shop')}>Browse Products</Button>
                    </Card>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Checkout</h1>

                    {/* Stepper */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${currentStep >= step.id
                                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                }`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            {currentStep > step.id ? (
                                                <CheckCircle className="w-8 h-8" />
                                            ) : (
                                                <step.icon className="w-8 h-8" />
                                            )}
                                        </motion.div>
                                        <p className="mt-2 text-sm font-semibold">{step.name}</p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`flex-1 h-1 mx-4 ${currentStep > step.id
                                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <Card className="p-8">
                                <AnimatePresence mode="wait">
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="shipping"
                                            initial={{ x: 50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -50, opacity: 0 }}
                                        >
                                            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <Input
                                                    label="Full Name"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="Email"
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="Phone"
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="Pincode"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <div className="md:col-span-2">
                                                    <Input
                                                        label="Address"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                                <Input
                                                    label="City"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <Input
                                                    label="State"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div
                                            key="payment"
                                            initial={{ x: 50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -50, opacity: 0 }}
                                        >
                                            <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                                            <div className="space-y-6">
                                                <Input
                                                    label="Card Number"
                                                    name="cardNumber"
                                                    value={formData.cardNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="1234 5678 9012 3456"
                                                    required
                                                />
                                                <Input
                                                    label="Cardholder Name"
                                                    name="cardName"
                                                    value={formData.cardName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <div className="grid grid-cols-2 gap-6">
                                                    <Input
                                                        label="Expiry Date"
                                                        name="expiryDate"
                                                        value={formData.expiryDate}
                                                        onChange={handleInputChange}
                                                        placeholder="MM/YY"
                                                        required
                                                    />
                                                    <Input
                                                        label="CVV"
                                                        name="cvv"
                                                        value={formData.cvv}
                                                        onChange={handleInputChange}
                                                        placeholder="123"
                                                        type="password"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 3 && (
                                        <motion.div
                                            key="review"
                                            initial={{ x: 50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -50, opacity: 0 }}
                                        >
                                            <h2 className="text-2xl font-bold mb-6">Review Order</h2>

                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        {formData.fullName}<br />
                                                        {formData.address}<br />
                                                        {formData.city}, {formData.state} - {formData.pincode}<br />
                                                        {formData.phone}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold mb-2">Payment Method</h3>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Card ending in {formData.cardNumber.slice(-4)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold mb-4">Order Items</h3>
                                                    <div className="space-y-3">
                                                        {items.map((item) => (
                                                            <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                <img
                                                                    src={item.product?.images?.[0] || 'https://via.placeholder.com/150?text=Product'}
                                                                    alt={item.product?.name || 'Product'}
                                                                    className="w-16 h-16 object-cover rounded bg-gray-200 dark:bg-gray-700"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = 'https://via.placeholder.com/150?text=Product';
                                                                    }}
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-semibold">{item.product?.name || 'Product'}</p>
                                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                                </div>
                                                                <p className="font-bold">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={currentStep === 1}
                                        leftIcon={<ArrowLeft className="w-5 h-5" />}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleNext}
                                        rightIcon={<ArrowRight className="w-5 h-5" />}
                                    >
                                        {currentStep === 3 ? 'Place Order' : 'Continue'}
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <Card className="p-6 sticky top-20">
                                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                                <div className="space-y-3 mb-4">
                                    {items.map((item) => (
                                        <div key={item.productId} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {item.product?.name || 'Product'} x {item.quantity}
                                            </span>
                                            <span className="font-semibold">{formatPrice((item.product?.price || 0) * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">{formatPrice(total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span className="font-semibold text-green-600">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span>Total</span>
                                        <span className="text-primary-600">{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Checkout;
