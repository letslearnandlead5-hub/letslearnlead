// Course Type Definitions
export interface IContentItem {
    _id?: string;
    type: 'video' | 'article';
    title: string;
    description: string;
    videoUrl?: string;
    articleContent?: string;
    duration?: string;
    order: number;
    isFree: boolean;
}

export interface ISubsection {
    _id?: string;
    title: string;
    description: string;
    order: number;
    content: IContentItem[];
}

export interface ISection {
    _id?: string;
    title: string;
    description: string;
    order: number;
    subsections: ISubsection[];
}

// Legacy lesson interface (for backward compatibility)
export interface ILesson {
    title: string;
    description: string;
    videoUrl: string;
    duration: string;
    order: number;
}

export interface ICourse {
    _id: string;
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
    sections: ISection[];
    lessons: ILesson[]; // Legacy field
    demoVideoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// Helper type for creating new courses
export interface ICourseFormData extends Omit<ICourse, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'studentsEnrolled'> {
    _id?: string;
}
