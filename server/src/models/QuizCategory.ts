import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizCategory extends Document {
    courseId: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId; // Optional for subject-level, undefined/null for course-level
    name: string;
    description?: string;
    icon?: string;   // Emoji or icon key (e.g. "📝", "🧠", "📑", "🏆")
    color?: string;  // Hex or Tailwind color theme
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const QuizCategorySchema = new Schema<IQuizCategory>(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course ID is required'],
            index: true,
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            default: '📝',
        },
        color: {
            type: String,
            default: '#6366f1',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for sorting and lookup
QuizCategorySchema.index({ courseId: 1, subjectId: 1, order: 1 });
QuizCategorySchema.index({ courseId: 1, subjectId: 1, isActive: 1 });

export const QuizCategory =
    mongoose.models.QuizCategory || mongoose.model<IQuizCategory>('QuizCategory', QuizCategorySchema);
