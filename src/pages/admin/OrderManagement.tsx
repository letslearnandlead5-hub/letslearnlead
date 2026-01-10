import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, TrendingUp, ShoppingCart, DollarSign, X, Truck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminAPI } from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { formatPrice } from '../../utils/helpers';

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const { addToast } = useToastStore();

    useEffect(() => {
        fetchOrders();
    }, [searchTerm, selectedStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedStatus !== 'all') params.status = selectedStatus;

            const response = await adminAPI.orders.getAll(params);
            setOrders(response.data || []);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            addToast({ type: 'error', message: 'Failed to load orders' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (order: any, newStatus: string) => {
        try {
            await adminAPI.orders.updateStatus(order._id, newStatus);
            addToast({ type: 'success', message: 'Order status updated!' });
            fetchOrders();
        } catch (error: any) {
            console.error('Error updating order:', error);
            addToast({ type: 'error', message: 'Failed to update order status' });
        }
    };

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order);
        setIsViewerOpen(true);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'delivered':
                return 'success';
            case 'shipped':
                return 'primary';
            case 'processing':
                return 'warning';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);

    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and manage customer orders
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Orders</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(totalRevenue)}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingOrders}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{deliveredOrders}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                            Clear
                        </Button>
                    )}
                </div>
            </Card>

            {/* Orders Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-gray-900 dark:text-white">
                                                {order.orderId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {order.userId?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order, e.target.value)}
                                                className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Order Details Modal */}
            <Modal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                title={`Order ${selectedOrder?.orderId || ''}`}
                size="xl"
            >
                {selectedOrder && (
                    <div className="p-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedOrder.userId?.name || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">{selectedOrder.userId?.email || ''}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(selectedOrder.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                                    {selectedOrder.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedOrder.paymentMethod || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {selectedOrder.shippingAddress && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Shipping Address
                                </h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedOrder.shippingAddress.name}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {selectedOrder.shippingAddress.address}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                                        {selectedOrder.shippingAddress.zipCode}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Phone: {selectedOrder.shippingAddress.phone}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatPrice(selectedOrder.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;
