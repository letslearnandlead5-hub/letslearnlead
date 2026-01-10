import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    stock: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        phone: string;
    };
    paymentMethod: string;
    paymentStatus: 'pending' | 'paid' | 'failed';
    orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        originalPrice: {
            type: Number,
        },
        images: [{ type: String }],
        category: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
    },
    {
        timestamps: true,
    }
);

const OrderItemSchema = new Schema<IOrderItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [OrderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        shippingAddress: {
            fullName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
            phone: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        orderStatus: {
            type: String,
            enum: ['processing', 'shipped', 'delivered', 'cancelled'],
            default: 'processing',
        },
    },
    {
        timestamps: true,
    }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
