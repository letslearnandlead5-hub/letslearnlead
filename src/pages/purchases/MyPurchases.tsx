import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, 
    Package, 
    Clock, 
    CheckCircle, 
    Eye, 
    Download,
    CreditCard,
    BookOpen,
    Calendar,
    FileText
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { shopAPI, courseAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { formatPrice } from '../../utils/helpers';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface Purchase {
    _id: string;
    orderId: string;
    type: 'course' | 'product' | 'bundle';
    items: Array<{
        itemId: {
            _id: string;
            title?: string;
            name?: string;
            thumbnail?: string;
            images?: string[];
        };
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionId?: string;
    accessStatus: 'active' | 'expired';
    expiryDate?: string;
    invoiceUrl?: string;
    createdAt: string;
}

interface Order {
    _id: string;
    items: Array<{
        productId: {
            _id: string;
            name: string;
            images: string[];
        };
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: string;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
    };
    paymentMethod: string;
    createdAt: string;
}

const MyPurchases: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'course' | 'product' | 'bundle'>('all');
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            // Fetch both course enrollments and product orders
            const [enrolledResponse, ordersResponse]: any = await Promise.all([
                courseAPI.getEnrolled(),
                shopAPI.orders.getAll()
            ]);

            const enrolledCourses = enrolledResponse.data || [];
            const orders = ordersResponse.data || [];

            // Transform enrolled courses to purchases
            const coursePurchases: Purchase[] = enrolledCourses.map((course: any) => ({
                _id: course._id,
                orderId: `COURSE-${course._id.slice(-8).toUpperCase()}`,
                type: 'course' as const,
                items: [{
                    itemId: {
                        _id: course._id,
                        title: course.title,
                        thumbnail: course.thumbnail,
                    },
                    quantity: 1,
                    price: course.price || 0,
                }],
                totalAmount: course.price || 0,
                paymentMethod: 'Credit Card',
                paymentDate: new Date().toISOString(),
                transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                accessStatus: 'active' as const,
                createdAt: new Date().toISOString(),
            }));

            // Transform product orders to purchases
            const productPurchases: Purchase[] = orders.map((order: any) => ({
                _id: order._id,
                orderId: order.orderId || `ORD-${order._id.slice(-8).toUpperCase()}`,
                type: 'product' as const,
                items: order.items.map((item: any) => ({
                    itemId: {
                        _id: item.productId?._id || item.productId,
                        name: item.name,
                        images: item.productId?.images || [],
                    },
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                paymentDate: order.createdAt,
                transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                accessStatus: 'active' as const,
                createdAt: order.createdAt,
            }));

            setPurchases([...coursePurchases, ...productPurchases]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            addToast({ type: 'error', message: 'Failed to load purchases' });
            setLoading(false);
        }
    };

    const handleViewDetails = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setIsDetailsOpen(true);
    };

    const handleDownloadInvoice = (_purchase: Purchase) => {
        // In real app, this would download the actual invoice
        addToast({ type: 'success', message: 'Invoice downloaded successfully!' });
    };

    const getAccessStatusColor = (status: string) => {
        return status === 'active' ? 'success' : 'danger';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'course':
                return BookOpen;
            case 'bundle':
                return Package;
            default:
                return ShoppingBag;
        }
    };

    const filteredPurchases = purchases.filter(p => 
        filterType === 'all' || p.type === filterType
    );

    const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const coursePurchases = purchases.filter(p => p.type === 'course').length;
    const productPurchases = purchases.filter(p => p.type === 'product').length;

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Purchases</h1>
                    <p className="text-gray-600 dark:text-gray-400">View your order history and track deliveries</p>
                </div>

                {/* Stats */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid md:grid-cols-4 gap-6 mb-8"
                >
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{purchases.length}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Courses</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{coursePurchases}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                    <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productPurchases}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatPrice(totalSpent)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant={filterType === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterType === 'course' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('course')}
                            leftIcon={<BookOpen className="w-4 h-4" />}
                        >
                            Courses
                        </Button>
                        <Button
                            variant={filterType === 'product' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('product')}
                            leftIcon={<Package className="w-4 h-4" />}
                        >
                            Products
                        </Button>
                        <Button
                            variant={filterType === 'bundle' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('bundle')}
                            leftIcon={<ShoppingBag className="w-4 h-4" />}
                        >
                            Bundles
                        </Button>
                    </div>
                </Card>

                {/* Purchases List */}
                {filteredPurchases.length === 0 ? (
                    <Card className="p-12 text-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Purchases Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your purchase history will appear here.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredPurchases.map((purchase) => {
                            const TypeIcon = getTypeIcon(purchase.type);
                            return (
                                <Card key={purchase._id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <TypeIcon className="w-5 h-5 text-primary-600" />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    Order #{purchase.orderId}
                                                </h3>
                                                <Badge variant="secondary" className="capitalize">
                                                    {purchase.type}
                                                </Badge>
                                                <Badge variant={getAccessStatusColor(purchase.accessStatus)}>
                                                    {purchase.accessStatus === 'active' ? 'Active' : 'Expired'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Payment Date: {new Date(purchase.paymentDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4" />
                                                    <span className="capitalize">Payment: {purchase.paymentMethod}</span>
                                                </div>
                                                {purchase.transactionId && (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        <span>Transaction ID: {purchase.transactionId}</span>
                                                    </div>
                                                )}
                                                {purchase.expiryDate && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Expires: {new Date(purchase.expiryDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                                            <p className="text-2xl font-bold text-primary-600">
                                                {formatPrice(purchase.totalAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                                        <div className="space-y-2">
                                            {purchase.items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded flex-shrink-0">
                                                        {(item.itemId.thumbnail || (item.itemId.images && item.itemId.images.length > 0)) ? (
                                                            <img
                                                                src={item.itemId.thumbnail || item.itemId.images![0]}
                                                                alt={item.itemId.title || item.itemId.name}
                                                                className="w-full h-full object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full">
                                                                <TypeIcon className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.itemId.title || item.itemId.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {item.quantity > 1 ? `Qty: ${item.quantity} × ` : ''}{formatPrice(item.price)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Eye className="w-4 h-4" />}
                                            onClick={() => handleViewDetails(purchase)}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<Download className="w-4 h-4" />}
                                            onClick={() => handleDownloadInvoice(purchase)}
                                        >
                                            Download Invoice
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Purchase Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title="Purchase Details"
                size="lg"
            >
                {selectedPurchase && (
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Order #{selectedPurchase.orderId}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Purchase Date: {new Date(selectedPurchase.paymentDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge variant={getAccessStatusColor(selectedPurchase.accessStatus)}>
                                    {selectedPurchase.accessStatus === 'active' ? 'Active Access' : 'Expired'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Payment Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order ID</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {selectedPurchase.orderId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(selectedPurchase.paymentDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
                                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                        {selectedPurchase.paymentMethod}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                                    <p className="font-semibold text-primary-600 text-lg">
                                        {formatPrice(selectedPurchase.totalAmount)}
                                    </p>
                                </div>
                                {selectedPurchase.transactionId && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID</p>
                                        <p className="font-mono text-sm text-gray-900 dark:text-white">
                                            {selectedPurchase.transactionId}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Purchased Items
                                </h4>
                                <div className="space-y-3">
                                    {selectedPurchase.items.map((item, index) => {
                                        const TypeIcon = getTypeIcon(selectedPurchase.type);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded">
                                                    {(item.itemId.thumbnail || (item.itemId.images && item.itemId.images.length > 0)) ? (
                                                        <img
                                                            src={item.itemId.thumbnail || item.itemId.images![0]}
                                                            alt={item.itemId.title || item.itemId.name}
                                                            className="w-full h-full object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <TypeIcon className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {item.itemId.title || item.itemId.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {item.quantity > 1 && `Quantity: ${item.quantity}`}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Access Status */}
                            {selectedPurchase.type === 'course' && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                        <h5 className="font-semibold text-gray-900 dark:text-white">
                                            Course Access Status
                                        </h5>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Status: <span className="font-semibold capitalize">{selectedPurchase.accessStatus}</span>
                                    </p>
                                    {selectedPurchase.expiryDate && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Valid Until: {new Date(selectedPurchase.expiryDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="primary"
                                    leftIcon={<Download className="w-4 h-4" />}
                                    onClick={() => handleDownloadInvoice(selectedPurchase)}
                                    className="flex-1"
                                >
                                    Download Invoice / Receipt
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDetailsOpen(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyPurchases;
