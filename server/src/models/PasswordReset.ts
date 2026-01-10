import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - auto-delete when expiresAt is reached
        },
        used: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
PasswordResetSchema.index({ token: 1 });
PasswordResetSchema.index({ userId: 1, used: 1 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);
