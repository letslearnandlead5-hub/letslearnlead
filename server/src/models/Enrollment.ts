import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed';
    purchaseDate?: Date;
    completionPercentage?: number;
    invoiceUrl?: string;
    invoiceNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        razorpayOrderId: {
            type: String,
            required: false, // Optional for free courses
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        amount: {
            type: Number,
            required: false, // Optional for free courses
            default: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        purchaseDate: {
            type: Date,
        },
        completionPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
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

// Index for faster queries
EnrollmentSchema.index({ userId: 1, courseId: 1 });
EnrollmentSchema.index({ razorpayOrderId: 1 });
EnrollmentSchema.index({ razorpayPaymentId: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
