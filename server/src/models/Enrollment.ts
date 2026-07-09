import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;  // Which subject was enrolled (required for subject-based courses)
    subjectName?: string;                // Denormalized e.g. "Mathematics"
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed';
    purchaseDate?: Date;
    completionPercentage?: number;
    completedLessons?: string[];
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
        subjectId: {
            type: Schema.Types.ObjectId,
            required: true, // Every enrollment must be for a specific subject
        },
        subjectName: {
            type: String,
            default: '',
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
        completedLessons: {
            type: [String],
            default: [],
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

// Indexes for faster queries
EnrollmentSchema.index({ userId: 1, courseId: 1 });
EnrollmentSchema.index({ userId: 1, courseId: 1, subjectId: 1 }, { unique: true }); // One enrollment per student per subject
EnrollmentSchema.index({ userId: 1, subjectId: 1 });
EnrollmentSchema.index({ razorpayOrderId: 1 });
EnrollmentSchema.index({ razorpayPaymentId: 1 });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ userId: 1, status: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
