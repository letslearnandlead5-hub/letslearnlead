import mongoose, { Document, Schema } from 'mongoose';

export interface IUserNote extends Document {
    userId: mongoose.Types.ObjectId;
    noteId: mongoose.Types.ObjectId;
    savedAt: Date;
    lastViewed?: Date;
    viewCount: number;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserNoteSchema = new Schema<IUserNote>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        noteId: {
            type: Schema.Types.ObjectId,
            ref: 'Note',
            required: true,
        },
        savedAt: {
            type: Date,
            default: Date.now,
        },
        lastViewed: {
            type: Date,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        category: {
            type: String,
            default: 'Uncategorized',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
UserNoteSchema.index({ userId: 1, noteId: 1 }, { unique: true });
UserNoteSchema.index({ userId: 1, category: 1 });

export const UserNote = mongoose.models.UserNote || mongoose.model<IUserNote>('UserNote', UserNoteSchema);
