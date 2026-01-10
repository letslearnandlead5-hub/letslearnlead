import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { generateEnrollmentInvoice, generateOrderInvoice } from '../utils/invoiceGenerator';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { AppError } from '../middleware/error';
import path from 'path';

const router = Router();

// @route   GET /api/invoice/enrollment/:enrollmentId
// @desc    Generate and download enrollment invoice
// @access  Private
router.get('/enrollment/:enrollmentId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user._id;

        // Verify enrollment belongs to user
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment not found', 404);
        }

        if (enrollment.userId.toString() !== userId.toString()) {
            throw new AppError('Unauthorized to access this invoice', 403);
        }

        if (enrollment.status !== 'paid') {
            throw new AppError('Cannot generate invoice for unpaid enrollment', 400);
        }

        // Generate invoice
        const { invoiceUrl, invoiceNumber } = await generateEnrollmentInvoice(enrollmentId);

        // Return invoice file
        const filePath = path.join(__dirname, '../../invoices', path.basename(invoiceUrl));
        res.download(filePath, `${invoiceNumber}.pdf`, (err) => {
            if (err) {
                next(new AppError('Error downloading invoice', 500));
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/invoice/order/:orderId
// @desc    Generate and download order invoice
// @access  Private
router.get('/order/:orderId', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        // Verify order belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId.toString() !== userId.toString()) {
            throw new AppError('Unauthorized to access this invoice', 403);
        }

        if (order.paymentStatus !== 'completed') {
            throw new AppError('Cannot generate invoice for unpaid order', 400);
        }

        // Generate invoice
        const { invoiceUrl, invoiceNumber } = await generateOrderInvoice(orderId);

        // Return invoice file
        const filePath = path.join(__dirname, '../../invoices', path.basename(invoiceUrl));
        res.download(filePath, `${invoiceNumber}.pdf`, (err) => {
            if (err) {
                next(new AppError('Error downloading invoice', 500));
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/invoice/enrollment/:enrollmentId/url
// @desc    Get invoice URL without downloading
// @access  Private
router.get('/enrollment/:enrollmentId/url', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user._id;

        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment not found', 404);
        }

        if (enrollment.userId.toString() !== userId.toString()) {
            throw new AppError('Unauthorized', 403);
        }

        if (!enrollment.invoiceUrl) {
            // Generate invoice if it doesn't exist
            const { invoiceUrl, invoiceNumber } = await generateEnrollmentInvoice(enrollmentId);
            return res.status(200).json({
                success: true,
                invoiceUrl,
                invoiceNumber,
            });
        }

        res.status(200).json({
            success: true,
            invoiceUrl: enrollment.invoiceUrl,
            invoiceNumber: enrollment.invoiceNumber,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/invoice/order/:orderId/url
// @desc    Get invoice URL without downloading
// @access  Private
router.get('/order/:orderId/url', protect, async (req: AuthRequest, res: Response, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId.toString() !== userId.toString()) {
            throw new AppError('Unauthorized', 403);
        }

        if (!order.invoiceUrl) {
            // Generate invoice if it doesn't exist
            const { invoiceUrl, invoiceNumber } = await generateOrderInvoice(orderId);
            return res.status(200).json({
                success: true,
                invoiceUrl,
                invoiceNumber,
            });
        }

        res.status(200).json({
            success: true,
            invoiceUrl: order.invoiceUrl,
            invoiceNumber: order.invoiceNumber,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
