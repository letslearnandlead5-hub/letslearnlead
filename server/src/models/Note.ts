import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
    courseId: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId; // Subject within the class-course
    subjectName?: string;                // Denormalized e.g. "Mathematics"
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
        subjectId: {
            type: Schema.Types.ObjectId,
            // References the embedded subject _id inside Course.subjects[]
        },
        subjectName: {
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
            enum: ['pdf', 'text', 'file', 'html'],
            default: 'file',
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
