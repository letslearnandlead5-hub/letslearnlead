import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Product, Order } from '../models/Product';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// Initialize Razorpay (optional - same as payment routes)
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'your_test_key_here' &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_test_secret_here') {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

// Products Routes

// @route   GET /api/shop/products
// @desc    Get all products
// @access  Public
router.get('/products', async (req: any, res: Response, next) => {
    try {
        const { category, search } = req.query;

        const filter: any = {};
        if (category) filter.category = category;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const products = await Product.find(filter);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/shop/products/:id
// @desc    Get single product
// @access  Public
router.get('/products/:id', async (req: any, res: Response, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
});

// Orders Routes

// @route   POST /api/shop/orders
// @desc    Create a new order
// @access  Private
router.post('/orders', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const orderData = {
            ...req.body,
            userId: req.user._id,
        };

        const order = await Order.create(orderData);

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/shop/orders
// @desc    Get user's orders
// @access  Private
router.get('/orders', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/shop/orders/:id
// @desc    Get single order
// @access  Private
router.get('/orders/:id', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Check if order belongs to user or user is admin
        if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new AppError('Not authorized to view this order', 403);
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/shop/orders/:id
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:id', protect, authorize('admin'), async (req: AuthRequest, res: Response, next) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/shop/create-payment-order
// @desc    Create Razorpay order for shop checkout
// @access  Private
router.post('/create-payment-order', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        if (!razorpay) {
            throw new AppError('Payment system is not configured. Please contact administrator.', 503);
        }

        const { items, shippingAddress, totalAmount } = req.body;

        if (!items || items.length === 0) {
            throw new AppError('No items in cart', 400);
        }

        // Create Razorpay order
        const amount = Math.round(totalAmount * 100);
        const currency = 'INR';

        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency,
            receipt: `shop_${req.user?._id}_${Date.now()}`,
            notes: {
                userId: req.user?._id.toString() || '',
                itemCount: items.length.toString(),
            },
        });

        // Create pending order in database
        const order = await Order.create({
            userId: req.user?._id,
            orderId: razorpayOrder.id,
            items: items.map((item: any) => ({
                productId: item.productId,
                name: item.product?.name || 'Product',
                price: item.product?.price || 0,
                quantity: item.quantity,
            })),
            totalAmount,
            shippingAddress,
            paymentMethod: 'razorpay',
            paymentStatus: 'pending',
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                dbOrderId: order._id,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/shop/verify-payment
// @desc    Verify Razorpay payment for shop order
// @access  Private
router.post('/verify-payment', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new AppError('Missing payment verification details', 400);
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            throw new AppError('Payment verification failed', 400);
        }

        // Update order status
        const order = await Order.findByIdAndUpdate(
            dbOrderId,
            {
                paymentStatus: 'completed',
                status: 'processing',
                orderId: razorpay_payment_id,
            },
            { new: true }
        );

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: order,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
