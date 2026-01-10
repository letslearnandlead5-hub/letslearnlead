import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
    email: string;
    isActive: boolean;
    subscribedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster email lookups
NewsletterSchema.index({ email: 1 });

export const Newsletter = mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
