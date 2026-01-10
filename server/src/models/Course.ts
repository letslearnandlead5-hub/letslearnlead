import mongoose, { Document, Schema } from 'mongoose';

// Content Item - Individual piece of content (video, article, etc.)
export interface IContentItem {
    _id?: mongoose.Types.ObjectId;
    type: 'video' | 'article' | 'quiz' | 'assignment';
    title: string;
    description: string;
    videoUrl?: string;
    articleContent?: string;
    duration?: string;
    order: number;
    isFree: boolean; // Allow preview of some content
}

// Subsection - Contains multiple content items
export interface ISubsection {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description: string;
    order: number;
    content: IContentItem[];
}

// Section - Top level grouping of subsections
export interface ISection {
    _id?: mongoose.Types.ObjectId;
    title: string;
    description: string;
    order: number;
    subsections: ISubsection[];
}

// Legacy Lesson interface (kept for backward compatibility)
export interface ILesson {
    title: string;
    description: string;
    videoUrl: string;
    duration: string;
    order: number;
}

export interface ICourse extends Document {
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    price: number;
    originalPrice?: number;
    rating: number;
    studentsEnrolled: number;
    duration: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    sections: ISection[]; // New hierarchical structure
    lessons: ILesson[]; // Legacy field for backward compatibility
    quizId?: mongoose.Types.ObjectId;
    demoVideoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Content Item Schema
const ContentItemSchema = new Schema<IContentItem>({
    type: {
        type: String,
        enum: ['video', 'article', 'quiz', 'assignment'],
        required: true,
        default: 'video',
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default: '',
    },
    videoUrl: {
        type: String,
        required: function (this: IContentItem) {
            return this.type === 'video';
        },
    },
    articleContent: {
        type: String,
        required: function (this: IContentItem) {
            return this.type === 'article';
        },
    },
    duration: {
        type: String,
        default: '0:00',
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    isFree: {
        type: Boolean,
        default: false,
    },
});

// Subsection Schema
const SubsectionSchema = new Schema<ISubsection>({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    content: [ContentItemSchema],
});

// Section Schema
const SectionSchema = new Schema<ISection>({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    subsections: [SubsectionSchema],
});

// Legacy Lesson Schema (for backward compatibility)
const LessonSchema = new Schema<ILesson>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String, required: true },
    order: { type: Number, required: true },
});

const CourseSchema = new Schema<ICourse>(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
        },
        instructor: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        originalPrice: {
            type: Number,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        studentsEnrolled: {
            type: Number,
            default: 0,
        },
        duration: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        sections: {
            type: [SectionSchema],
            default: [],
        },
        lessons: {
            type: [LessonSchema],
            default: [],
        },
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
        },
        demoVideoUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
