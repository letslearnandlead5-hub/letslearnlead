import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
    title: string;
    subtitle: string;
    discount: string;
    cta: string;
    image: string;
    bgGradient: [string, string];
    actionType: 'category' | 'course' | 'search';
    actionId?: string;
    actionName?: string;
    actionQuery?: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            required: true,
            trim: true,
        },
        discount: {
            type: String,
            required: true,
            trim: true,
        },
        cta: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        bgGradient: {
            type: [String],
            required: true,
            validate: {
                validator: function(v: string[]) {
                    return v.length === 2;
                },
                message: 'bgGradient must contain exactly 2 colors',
            },
        },
        actionType: {
            type: String,
            enum: ['category', 'course', 'search'],
            required: true,
        },
        actionId: {
            type: String,
        },
        actionName: {
            type: String,
        },
        actionQuery: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
BannerSchema.index({ isActive: 1, order: 1 });

export const Banner = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
