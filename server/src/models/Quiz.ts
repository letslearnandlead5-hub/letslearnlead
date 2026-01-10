import mongoose, { Document, Schema } from 'mongoose';

// Question Option
export interface IQuestionOption {
    id: string;
    text: string;
    imageUrl?: string;
}

// Quiz Question
export interface IQuizQuestion {
    _id?: mongoose.Types.ObjectId;
    questionType: 'text' | 'image' | 'formula' | 'diagram';
    questionText: string;
    questionImage?: string;
    questionFormula?: string; // LaTeX formula
    questionDiagram?: string; // URL to diagram image
    options: IQuestionOption[];
    correctAnswer: string; // ID of the correct option
    explanation: string;
    marks: number; // Marks for this question (can override quiz-level setting)
    negativeMarks?: number; // Negative marks for this question (can override quiz-level setting)
    order: number;
}

// Quiz Settings
export interface IQuizSettings {
    marksPerQuestion: number;
    negativeMarking: number; // Negative marks per wrong answer
    timeLimit: number; // Time limit in minutes
    passingPercentage?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResultsImmediately?: boolean;
    allowRetake?: boolean;
    maxAttempts?: number;
}

export interface IQuiz extends Document {
    title: string;
    description: string;
    courseId: mongoose.Types.ObjectId;
    courseName: string; // Denormalized for easier querying
    totalQuestions: number;
    settings: IQuizSettings;
    questions: IQuizQuestion[];
    isPublished: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Question Option Schema
const QuestionOptionSchema = new Schema<IQuestionOption>({
    id: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
});

// Quiz Question Schema
const QuizQuestionSchema = new Schema<IQuizQuestion>({
    questionType: {
        type: String,
        enum: ['text', 'image', 'formula', 'diagram'],
        required: true,
        default: 'text',
    },
    questionText: {
        type: String,
        required: true,
    },
    questionImage: {
        type: String,
    },
    questionFormula: {
        type: String,
    },
    questionDiagram: {
        type: String,
    },
    options: {
        type: [QuestionOptionSchema],
        required: true,
        validate: {
            validator: function (options: IQuestionOption[]) {
                return options.length >= 2 && options.length <= 6;
            },
            message: 'A question must have between 2 and 6 options',
        },
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    explanation: {
        type: String,
        required: true,
    },
    marks: {
        type: Number,
        required: true,
        min: 0,
    },
    negativeMarks: {
        type: Number,
        default: 0,
        min: 0,
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
});

// Quiz Settings Schema
const QuizSettingsSchema = new Schema<IQuizSettings>({
    marksPerQuestion: {
        type: Number,
        required: true,
        default: 1,
        min: 0,
    },
    negativeMarking: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    timeLimit: {
        type: Number,
        required: true,
        default: 30,
        min: 1,
    },
    passingPercentage: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
    },
    shuffleQuestions: {
        type: Boolean,
        default: false,
    },
    shuffleOptions: {
        type: Boolean,
        default: false,
    },
    showResultsImmediately: {
        type: Boolean,
        default: true,
    },
    allowRetake: {
        type: Boolean,
        default: false,
    },
    maxAttempts: {
        type: Number,
        default: 1,
        min: 1,
    },
});

// Quiz Schema
const QuizSchema = new Schema<IQuiz>(
    {
        title: {
            type: String,
            required: [true, 'Quiz title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Quiz description is required'],
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
            default: 0,
        },
        settings: {
            type: QuizSettingsSchema,
            required: true,
        },
        questions: {
            type: [QuizQuestionSchema],
            default: [],
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
QuizSchema.index({ courseId: 1, isPublished: 1 });
QuizSchema.index({ createdBy: 1 });
QuizSchema.index({ title: 'text', description: 'text' });

// Update totalQuestions before saving
QuizSchema.pre('save', function (next) {
    this.totalQuestions = this.questions.length;
    next();
});

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
