import mongoose, { Document, Schema } from 'mongoose';

// Detailed breakdown for each question
export interface IQuestionResult {
    questionId: mongoose.Types.ObjectId;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
}

export interface IQuizResult extends Document {
    attemptId: mongoose.Types.ObjectId;
    quizId: mongoose.Types.ObjectId;
    quizTitle: string;
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    studentEmail: string;
    courseId: mongoose.Types.ObjectId;
    courseName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    isPassed: boolean;
    timeTaken: number; // in seconds
    rank?: number; // Position in leaderboard
    questionResults: IQuestionResult[];
    feedback?: string;
    evaluatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Question Result Schema
const QuestionResultSchema = new Schema<IQuestionResult>({
    questionId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    selectedAnswer: {
        type: String,
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    marksAwarded: {
        type: Number,
        required: true,
    },
    explanation: {
        type: String,
        required: true,
    },
});

// Quiz Result Schema
const QuizResultSchema = new Schema<IQuizResult>(
    {
        attemptId: {
            type: Schema.Types.ObjectId,
            ref: 'QuizAttempt',
            required: true,
            unique: true,
        },
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        quizTitle: {
            type: String,
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
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        courseName: {
            type: String,
            required: true,
        },
        totalQuestions: {
            type: Number,
            required: true,
        },
        correctAnswers: {
            type: Number,
            required: true,
            default: 0,
        },
        incorrectAnswers: {
            type: Number,
            required: true,
            default: 0,
        },
        unansweredQuestions: {
            type: Number,
            required: true,
            default: 0,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        marksObtained: {
            type: Number,
            required: true,
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        isPassed: {
            type: Boolean,
            required: true,
        },
        timeTaken: {
            type: Number,
            required: true,
        },
        rank: {
            type: Number,
        },
        questionResults: {
            type: [QuestionResultSchema],
            required: true,
        },
        feedback: {
            type: String,
        },
        evaluatedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
QuizResultSchema.index({ quizId: 1, marksObtained: -1, timeTaken: 1 }); // For leaderboard
QuizResultSchema.index({ studentId: 1, quizId: 1 });
QuizResultSchema.index({ courseId: 1 });
QuizResultSchema.index({ percentage: -1 });

// Generate feedback based on performance
QuizResultSchema.pre('save', function (next) {
    if (!this.feedback) {
        const percentage = this.percentage;
        if (percentage >= 90) {
            this.feedback = 'Outstanding! You have demonstrated excellent understanding of the material.';
        } else if (percentage >= 75) {
            this.feedback = 'Great job! You have a strong grasp of the concepts.';
        } else if (percentage >= 60) {
            this.feedback = 'Good effort! Review the explanations to strengthen your understanding.';
        } else if (percentage >= 40) {
            this.feedback = 'Keep practicing! Focus on the topics where you struggled.';
        } else {
            this.feedback = 'More practice needed. Please review the course material and try again.';
        }
    }
    next();
});

export const QuizResult =
    mongoose.models.QuizResult || mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);
