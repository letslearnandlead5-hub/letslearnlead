import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoProgress extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    lessonId: string;
    progress: number; // Percentage (0-100)
    lastWatchedAt: Date;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VideoProgressSchema = new Schema<IVideoProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        lessonId: {
            type: String,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },
        lastWatchedAt: {
            type: Date,
            default: Date.now,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique user+course+lesson combination
VideoProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
VideoProgressSchema.index({ userId: 1, courseId: 1 });
VideoProgressSchema.index({ userId: 1, completed: 1 });

export const VideoProgress = mongoose.model<IVideoProgress>('VideoProgress', VideoProgressSchema);
