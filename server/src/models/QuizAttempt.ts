import mongoose, { Document, Schema } from 'mongoose';

// Student's answer for a question
export interface IQuizAnswer {
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: string; // ID of the selected option
    isCorrect?: boolean; // Evaluated after submission
    marksAwarded?: number;
    timeTaken?: number; // Time spent on this question in seconds
}

export interface IQuizAttempt extends Document {
    quizId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    studentName: string; // Denormalized for easier display
    studentEmail: string;
    answers: IQuizAnswer[];
    status: 'in-progress' | 'completed' | 'abandoned' | 'expired';
    startedAt: Date;
    submittedAt?: Date;
    timeTaken?: number; // Total time taken in seconds
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Quiz Answer Schema
const QuizAnswerSchema = new Schema<IQuizAnswer>({
    questionId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    selectedAnswer: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
    },
    marksAwarded: {
        type: Number,
        default: 0,
    },
    timeTaken: {
        type: Number,
        default: 0,
    },
});

// Quiz Attempt Schema
const QuizAttemptSchema = new Schema<IQuizAttempt>(
    {
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        studentEmail: {
            type: String,
            required: true,
        },
        answers: {
            type: [QuizAnswerSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ['in-progress', 'completed', 'abandoned', 'expired'],
            default: 'in-progress',
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        submittedAt: {
            type: Date,
        },
        timeTaken: {
            type: Number, // in seconds
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
QuizAttemptSchema.index({ quizId: 1, studentId: 1 });
QuizAttemptSchema.index({ studentId: 1, status: 1 });
QuizAttemptSchema.index({ quizId: 1, status: 1 });
QuizAttemptSchema.index({ startedAt: 1 });

// Calculate time taken before saving
QuizAttemptSchema.pre('save', function (next) {
    if (this.status === 'completed' && this.submittedAt && this.startedAt) {
        this.timeTaken = Math.floor((this.submittedAt.getTime() - this.startedAt.getTime()) / 1000);
    }
    next();
});

export const QuizAttempt =
    mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
