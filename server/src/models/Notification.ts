import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    link?: string;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            default: 'info',
        },
        read: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
