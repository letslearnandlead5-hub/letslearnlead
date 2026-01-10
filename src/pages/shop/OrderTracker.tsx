import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StudentHeader from '../../components/layout/StudentHeader';
import StudentFooter from '../../components/layout/StudentFooter';

interface OrderStatus {
    id: number;
    name: string;
    description: string;
    icon: React.ElementType;
    completed: boolean;
    date?: string;
}

const OrderTracker: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(2);
    
    // Get shipping address from location state or use default
    const shippingAddress = location.state?.shippingAddress || {
        fullName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91 9876543210',
    };
    
    console.log('Order tracker received shipping address:', shippingAddress);

    const steps: OrderStatus[] = [
        {
            id: 1,
            name: 'Order Placed',
            description: 'Your order has been confirmed',
            icon: CheckCircle,
            completed: true,
            date: new Date().toLocaleDateString(),
        },
        {
            id: 2,
            name: 'Processing',
            description: 'Order is being prepared',
            icon: Package,
            completed: currentStep >= 2,
            date: currentStep >= 2 ? new Date().toLocaleDateString() : undefined,
        },
        {
            id: 3,
            name: 'Shipped',
            description: 'Package is on the way',
            icon: Truck,
            completed: currentStep >= 3,
            date: currentStep >= 3 ? new Date().toLocaleDateString() : undefined,
        },
        {
            id: 4,
            name: 'Delivered',
            description: 'Package has been delivered',
            icon: MapPin,
            completed: currentStep >= 4,
            date: currentStep >= 4 ? new Date().toLocaleDateString() : undefined,
        },
    ];

    // Simulate progress
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <StudentHeader />
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12">
                <div className="container max-w-4xl mx-auto px-4">
                <Card className="p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text mb-2">Track Your Order</h1>
                            <p className="text-gray-600 dark:text-gray-400">Order ID: {orderId}</p>
                        </div>
                        <Badge variant={currentStep === 4 ? 'success' : 'primary'} className="text-lg px-4 py-2">
                            {currentStep === 4 ? 'Delivered' : 'In Progress'}
                        </Badge>
                    </div>

                    {/* Stepper */}
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute left-8 top-8 bottom-8 w-1 bg-gray-200 dark:bg-gray-700">
                            <motion.div
                                className="bg-gradient-to-b from-primary-600 to-secondary-600 w-full"
                                initial={{ height: 0 }}
                                animate={{ height: `${((currentStep - 1) / 3) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Steps */}
                        <div className="space-y-8 relative">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    className="flex items-start gap-6"
                                    initial={{ x: -50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="relative z-10">
                                        <motion.div
                                            className={`w-16 h-16 rounded-full flex items-center justify-center ${step.completed
                                                    ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                }`}
                                            whileHover={{ scale: 1.1 }}
                                            animate={step.completed ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <step.icon className="w-8 h-8" />
                                        </motion.div>
                                    </div>

                                    <div className="flex-1 pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-xl font-bold ${step.completed ? '' : 'text-gray-400'}`}>
                                                {step.name}
                                            </h3>
                                            {step.date && (
                                                <span className="text-sm text-gray-500">{step.date}</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400">{step.description}</p>

                                        {!step.completed && index === currentStep && (
                                            <div className="flex items-center gap-2 mt-2 text-primary-600">
                                                <Clock className="w-4 h-4 animate-pulse" />
                                                <span className="text-sm font-semibold">In Progress...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Order Details */}
                <Card className="p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-6">Order Details</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-3">Delivery Address</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {shippingAddress.fullName}<br />
                                {shippingAddress.address}<br />
                                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}<br />
                                Phone: {shippingAddress.phone}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Estimated Delivery</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                            <h3 className="font-semibold mb-3">Tracking Number</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-mono">
                                TRK{Math.random().toString(36).substring(7).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                        Back to Home
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={() => navigate('/dashboard')}>
                        View All Orders
                    </Button>
                </div>
                </div>
            </div>
            <StudentFooter />
        </div>
    );
};

export default OrderTracker;
