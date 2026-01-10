import mongoose, { Document, Schema } from 'mongoose';

export interface IDoubt extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    courseId?: mongoose.Types.ObjectId;
    courseName?: string;
    subject: string;
    description: string;
    category: 'course' | 'general' | 'technical' | 'other';
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'resolved';
    response?: string;
    respondedBy?: mongoose.Types.ObjectId;
    respondedAt?: Date;
    attachments?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const DoubtSchema = new Schema<IDoubt>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
        },
        courseName: {
            type: String,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['course', 'general', 'technical', 'other'],
            default: 'general',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'resolved'],
            default: 'pending',
        },
        response: {
            type: String,
        },
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        respondedAt: {
            type: Date,
        },
        attachments: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for optimized queries
DoubtSchema.index({ studentId: 1, status: 1, createdAt: -1 });
DoubtSchema.index({ courseId: 1, status: 1 });
DoubtSchema.index({ status: 1, createdAt: -1 });

export const Doubt = mongoose.models.Doubt || mongoose.model<IDoubt>('Doubt', DoubtSchema);
