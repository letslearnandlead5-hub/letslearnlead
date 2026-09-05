import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId;  // Which subject was enrolled; null = entire course enrolled
    subjectName?: string;                // Denormalized e.g. "Mathematics"; empty for course-level enrollment
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
            required: false,   // Optional: null = enrolled in the whole course
            default: null,
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
// Allow one enrollment per student per course (course-level has subjectId=null, subject-level has a value)
EnrollmentSchema.index({ userId: 1, courseId: 1, subjectId: 1 });
EnrollmentSchema.index({ userId: 1, subjectId: 1 });
EnrollmentSchema.index({ razorpayOrderId: 1 });
EnrollmentSchema.index({ razorpayPaymentId: 1 });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ userId: 1, status: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INCREMENT studentsEnrolled on the parent Course whenever a NEW paid
// enrollment is created.  This is the single authoritative place so that ALL
// enrollment paths (payment approval, free enroll, admin manual enroll,
// progress-route fallback, etc.) are covered automatically.
// ─────────────────────────────────────────────────────────────────────────────
EnrollmentSchema.post('save', async function (doc) {
    // Only fire for brand-new paid documents
    if (!doc.isNew || doc.status !== 'paid') return;

    try {
        const Course = mongoose.model('Course');
        await Course.findByIdAndUpdate(doc.courseId, { $inc: { studentsEnrolled: 1 } });

        // Bust cache so admin list reflects the new count immediately
        const { cache } = await import('../utils/cache');
        cache.invalidatePrefix('courses:');
        cache.invalidate(`course:${doc.courseId.toString()}`);
    } catch (err) {
        // Log but never crash the request — enrollment itself already succeeded
        console.error('⚠️  [Enrollment hook] Failed to increment studentsEnrolled:', err);
    }
});

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
