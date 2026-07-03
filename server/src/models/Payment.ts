import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    courseId: mongoose.Types.ObjectId;
    courseName: string;
    amount: number;
    currency: string;
    paymentMethod: 'qr' | 'gateway';
    transactionId: string;
    paymentScreenshot?: string; // base64 encoded
    paymentStatus: 'pending' | 'approved' | 'rejected';
    paymentDate: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedDate?: Date;
    adminRemark?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        studentName: {
            type: String,
            required: true,
            trim: true,
        },
        studentEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        studentPhone: {
            type: String,
            required: true,
            trim: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        courseName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        paymentMethod: {
            type: String,
            enum: ['qr', 'gateway'],
            default: 'qr',
        },
        transactionId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        paymentScreenshot: {
            type: String,
            default: '',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        verifiedDate: {
            type: Date,
        },
        adminRemark: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate submission for same student + course + transactionId
PaymentSchema.index({ studentId: 1, courseId: 1, transactionId: 1 }, { unique: true });
PaymentSchema.index({ paymentStatus: 1, createdAt: -1 });
PaymentSchema.index({ courseId: 1, paymentStatus: 1 });

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
