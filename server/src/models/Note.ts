import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
    courseId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    fileUrl?: string;
    fileType: string;
    markdownContent?: string;
    tags?: string[];
    category?: string;
    isPublic: boolean;
    uploadedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
        },
        fileType: {
            type: String,
            required: true,
            enum: ['pdf', 'markdown', 'document', 'text', 'file'],
            default: 'markdown',
        },
        markdownContent: {
            type: String,
        },
        tags: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Note = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
