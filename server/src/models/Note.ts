import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
    courseId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;   // Required subject link
    subjectName?: string;                // Denormalized e.g. "Mathematics"
    chapterId?: string;                  // Optional chapter link
    chapterName?: string;                // Denormalized e.g. "Cell Structure"
    title: string;
    description: string;
    fileUrl?: string;
    fileType: 'pdf' | 'txt' | 'doc' | 'file' | 'html';
    markdownContent?: string;
    tags?: string[];
    category?: string;
    isPublic: boolean;
    status: 'active' | 'inactive';
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
        subjectId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        subjectName: {
            type: String,
            default: '',
        },
        chapterId: {
            type: String,
            default: '',
        },
        chapterName: {
            type: String,
            default: '',
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
            enum: ['pdf', 'txt', 'doc', 'file', 'html'],
            default: 'pdf',
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
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
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

// Compound & Text Indexes for fast hierarchy & search performance
NoteSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });
NoteSchema.index({ courseId: 1, subjectId: 1, status: 1, createdAt: -1 });
NoteSchema.index({ courseId: 1, subjectId: 1, chapterId: 1 });
NoteSchema.index({ createdAt: -1 });

export const Note = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

