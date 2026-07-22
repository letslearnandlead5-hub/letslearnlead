import mongoose, { Document, Schema } from 'mongoose';

export interface INoteAccessLog extends Document {
    studentId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId;
    noteId: mongoose.Types.ObjectId;
    action: 'view' | 'print' | 'token_issued';
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}

const NoteAccessLogSchema = new Schema<INoteAccessLog>(
    {
        studentId: {
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
            required: false,
        },
        noteId: {
            type: Schema.Types.ObjectId,
            ref: 'Note',
            required: true,
        },
        action: {
            type: String,
            enum: ['view', 'print', 'token_issued'],
            required: true,
        },
        ip: { type: String },
        userAgent: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes for audit queries
NoteAccessLogSchema.index({ studentId: 1, noteId: 1, createdAt: -1 });
NoteAccessLogSchema.index({ noteId: 1, action: 1 });
NoteAccessLogSchema.index({ createdAt: -1 });

export const NoteAccessLog =
    mongoose.models.NoteAccessLog ||
    mongoose.model<INoteAccessLog>('NoteAccessLog', NoteAccessLogSchema);
