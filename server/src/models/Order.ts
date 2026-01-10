import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    orderId: string;
    items: Array<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        phone: string;
    };
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
    invoiceUrl?: string;
    invoiceNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        shippingAddress: {
            name: String,
            address: String,
            city: String,
            state: String,
            zipCode: String,
            phone: String,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        invoiceUrl: {
            type: String,
        },
        invoiceNumber: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
