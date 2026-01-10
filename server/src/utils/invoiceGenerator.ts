import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Course } from '../models/Course';

// Ensure invoices directory exists
const INVOICES_DIR = path.join(__dirname, '../../invoices');
if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

// Generate unique invoice number
const generateInvoiceNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
};

// Helper to draw a horizontal line
const drawLine = (doc: PDFKit.PDFDocument, y: number) => {
    doc
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
};

export const generateEnrollmentInvoice = async (enrollmentId: string): Promise<{ invoiceUrl: string; invoiceNumber: string }> => {
    try {
        // Fetch enrollment with populated data
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate('userId', 'name email')
            .populate('courseId', 'title instructor');

        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        // Check if invoice already exists
        if (enrollment.invoiceUrl && enrollment.invoiceNumber) {
            return {
                invoiceUrl: enrollment.invoiceUrl,
                invoiceNumber: enrollment.invoiceNumber,
            };
        }

        const user = enrollment.userId as any;
        const course = enrollment.courseId as any;
        const invoiceNumber = generateInvoiceNumber();
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(INVOICES_DIR, fileName);
        const invoiceUrl = `/invoices/${fileName}`;

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header with gradient effect
        doc
            .fillColor('#667eea')
            .fontSize(32)
            .font('Helvetica-Bold')
            .text("Let's L-Earn and Lead", 50, 45);

        doc
            .fillColor('#666')
            .fontSize(10)
            .font('Helvetica')
            .text('Educational Platform', 50, 85);

        // Invoice label
        doc
            .fillColor('#333')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('INVOICE', 400, 50, { width: 150, align: 'right' });

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text(invoiceNumber, 400, 80, { width: 150, align: 'right' });

        // Line separator
        drawLine(doc, 120);

        // Billing information
        let yPos = 150;

        doc
            .fillColor('#333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Bill To:', 50, yPos);

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text(user.name, 50, yPos + 20)
            .text(user.email, 50, yPos + 35);

        // Invoice details (right side)
        doc
            .fillColor('#333')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Invoice Date:', 350, yPos, { width: 100 })
            .text('Payment Status:', 350, yPos + 20, { width: 100 })
            .text('Payment Method:', 350, yPos + 40, { width: 100 });

        doc
            .fillColor('#666')
            .font('Helvetica')
            .text(new Date(enrollment.purchaseDate || enrollment.createdAt).toLocaleDateString('en-IN'), 460, yPos, { width: 100, align: 'right' })
            .text(enrollment.status === 'paid' ? 'Paid' : 'Pending', 460, yPos + 20, { width: 100, align: 'right' })
            .text('Razorpay', 460, yPos + 40, { width: 100, align: 'right' });

        yPos += 100;
        drawLine(doc, yPos);

        // Table header
        yPos += 30;
        doc
            .fillColor('#667eea')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Description', 50, yPos)
            .text('Instructor', 280, yPos)
            .text('Amount', 480, yPos, { width: 70, align: 'right' });

        yPos += 25;
        drawLine(doc, yPos);

        // Course item
        yPos += 20;
        doc
            .fillColor('#333')
            .fontSize(11)
            .font('Helvetica')
            .text(course.title, 50, yPos, { width: 220 })
            .text(course.instructor, 280, yPos, { width: 180 })
            .text(`₹${enrollment.amount.toFixed(2)}`, 480, yPos, { width: 70, align: 'right' });

        yPos += 40;
        drawLine(doc, yPos);

        // Totals
        yPos += 20;
        const subtotal = enrollment.amount;
        const tax = 0; // Add tax calculation if needed
        const total = subtotal + tax;

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text('Subtotal:', 380, yPos)
            .text(`₹${subtotal.toFixed(2)}`, 480, yPos, { width: 70, align: 'right' });

        if (tax > 0) {
            yPos += 20;
            doc
                .text('Tax (GST 18%):', 380, yPos)
                .text(`₹${tax.toFixed(2)}`, 480, yPos, { width: 70, align: 'right' });
        }

        yPos += 25;
        drawLine(doc, yPos);

        yPos += 15;
        doc
            .fillColor('#333')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('Total:', 380, yPos)
            .text(`₹${total.toFixed(2)}`, 480, yPos, { width: 70, align: 'right' });

        // Payment details
        yPos += 60;
        doc
            .fillColor('#333')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Payment Details:', 50, yPos);

        yPos += 20;
        doc
            .fillColor('#666')
            .fontSize(10)
            .font('Helvetica')
            .text(`Order ID: ${enrollment.razorpayOrderId}`, 50, yPos);

        if (enrollment.razorpayPaymentId) {
            yPos += 15;
            doc.text(`Payment ID: ${enrollment.razorpayPaymentId}`, 50, yPos);
        }

        // Footer
        yPos = 700;
        drawLine(doc, yPos);

        doc
            .fillColor('#999')
            .fontSize(9)
            .font('Helvetica')
            .text('Thank you for your purchase!', 50, yPos + 20, { width: 500, align: 'center' })
            .text('For support, contact us at support@letslean.com', 50, yPos + 35, { width: 500, align: 'center' })
            .text(`© ${new Date().getFullYear()} Let's L-Earn and Lead. All rights reserved.`, 50, yPos + 50, { width: 500, align: 'center' });

        // Finalize PDF
        doc.end();

        // Wait for stream to finish
        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });

        // Update enrollment with invoice details
        enrollment.invoiceUrl = invoiceUrl;
        enrollment.invoiceNumber = invoiceNumber;
        await enrollment.save();

        return { invoiceUrl, invoiceNumber };
    } catch (error) {
        console.error('Error generating enrollment invoice:', error);
        throw error;
    }
};

export const generateOrderInvoice = async (orderId: string): Promise<{ invoiceUrl: string; invoiceNumber: string }> => {
    try {
        // Fetch order with populated data
        const order = await Order.findById(orderId).populate('userId', 'name email');

        if (!order) {
            throw new Error('Order not found');
        }

        // Check if invoice already exists
        if (order.invoiceUrl && order.invoiceNumber) {
            return {
                invoiceUrl: order.invoiceUrl,
                invoiceNumber: order.invoiceNumber,
            };
        }

        const user = order.userId as any;
        const invoiceNumber = generateInvoiceNumber();
        const fileName = `${invoiceNumber}.pdf`;
        const filePath = path.join(INVOICES_DIR, fileName);
        const invoiceUrl = `/invoices/${fileName}`;

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc
            .fillColor('#667eea')
            .fontSize(32)
            .font('Helvetica-Bold')
            .text("Let's L-Earn and Lead", 50, 45);

        doc
            .fillColor('#666')
            .fontSize(10)
            .font('Helvetica')
            .text('Shop Invoice', 50, 85);

        // Invoice label
        doc
            .fillColor('#333')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('INVOICE', 400, 50, { width: 150, align: 'right' });

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text(invoiceNumber, 400, 80, { width: 150, align: 'right' });

        drawLine(doc, 120);

        // Billing and shipping information
        let yPos = 150;

        doc
            .fillColor('#333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Bill To:', 50, yPos)
            .text('Ship To:', 300, yPos);

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text(user.name, 50, yPos + 20)
            .text(user.email, 50, yPos + 35);

        doc
            .text(order.shippingAddress.name, 300, yPos + 20)
            .text(order.shippingAddress.address, 300, yPos + 35)
            .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, 300, yPos + 50)
            .text(`Phone: ${order.shippingAddress.phone}`, 300, yPos + 65);

        yPos += 110;
        drawLine(doc, yPos);

        // Table header
        yPos += 30;
        doc
            .fillColor('#667eea')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Item', 50, yPos)
            .text('Qty', 350, yPos, { width: 50, align: 'center' })
            .text('Price', 420, yPos, { width: 60, align: 'right' })
            .text('Amount', 490, yPos, { width: 60, align: 'right' });

        yPos += 25;
        drawLine(doc, yPos);

        // Order items
        yPos += 20;
        order.items.forEach((item: { name: string; quantity: number; price: number }) => {
            doc
                .fillColor('#333')
                .fontSize(11)
                .font('Helvetica')
                .text(item.name, 50, yPos, { width: 280 })
                .text(item.quantity.toString(), 350, yPos, { width: 50, align: 'center' })
                .text(`₹${item.price.toFixed(2)}`, 420, yPos, { width: 60, align: 'right' })
                .text(`₹${(item.price * item.quantity).toFixed(2)}`, 490, yPos, { width: 60, align: 'right' });

            yPos += 25;
        });

        drawLine(doc, yPos);

        // Totals
        yPos += 20;
        const subtotal = order.totalAmount;
        const tax = 0;
        const shipping = 0;
        const total = subtotal + tax + shipping;

        doc
            .fillColor('#666')
            .fontSize(11)
            .font('Helvetica')
            .text('Subtotal:', 380, yPos)
            .text(`₹${subtotal.toFixed(2)}`, 490, yPos, { width: 60, align: 'right' });

        if (shipping > 0) {
            yPos += 20;
            doc
                .text('Shipping:', 380, yPos)
                .text(`₹${shipping.toFixed(2)}`, 490, yPos, { width: 60, align: 'right' });
        }

        yPos += 25;
        drawLine(doc, yPos);

        yPos += 15;
        doc
            .fillColor('#333')
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('Total:', 380, yPos)
            .text(`₹${total.toFixed(2)}`, 490, yPos, { width: 60, align: 'right' });

        // Payment details
        yPos += 60;
        doc
            .fillColor('#333')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Payment Details:', 50, yPos);

        yPos += 20;
        doc
            .fillColor('#666')
            .fontSize(10)
            .font('Helvetica')
            .text(`Order ID: ${order.orderId}`, 50, yPos)
            .text(`Payment Method: ${order.paymentMethod}`, 50, yPos + 15)
            .text(`Payment Status: ${order.paymentStatus}`, 50, yPos + 30);

        // Footer
        yPos = 700;
        drawLine(doc, yPos);

        doc
            .fillColor('#999')
            .fontSize(9)
            .font('Helvetica')
            .text('Thank you for shopping with us!', 50, yPos + 20, { width: 500, align: 'center' })
            .text('For support, contact us at support@letslean.com', 50, yPos + 35, { width: 500, align: 'center' })
            .text(`© ${new Date().getFullYear()} Let's L-Earn and Lead. All rights reserved.`, 50, yPos + 50, { width: 500, align: 'center' });

        // Finalize PDF
        doc.end();

        // Wait for stream to finish
        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });

        // Update order with invoice details
        order.invoiceUrl = invoiceUrl;
        order.invoiceNumber = invoiceNumber;
        await order.save();

        return { invoiceUrl, invoiceNumber };
    } catch (error) {
        console.error('Error generating order invoice:', error);
        throw error;
    }
};
