// User types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    avatar?: string;
    profilePicture?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    grade?: string;
    stream?: string;
    institution?: string;
    subjectInterests?: string[];
    createdAt?: string;
}

// Subject types — a subject inside a class-course (e.g., Mathematics in Class 9)
export interface Subject {
    _id: string;
    name: string;           // e.g., "Mathematics", "Science"
    description?: string;
    icon?: string;          // Emoji e.g. "📐"
    price: number;
    originalPrice?: number;
    order: number;
    sections?: CourseSection[]; // Content (loaded on course detail page)
}

// Course types
export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    instructor: string;
    price: number;
    originalPrice?: number;
    rating: number;
    studentsEnrolled: number;
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    category: string;
    grade?: string;
    medium?: string;
    paymentEnabled?: boolean;
    paymentMethod?: string;
    qrImage?: string;
    upiId?: string;
    merchantName?: string;
    paymentInstructions?: string;
    subjects: Subject[];    // Subject-based content (new structure)
    lessons: Lesson[];
    curriculum: CurriculumSection[];
    featuredOnHome?: boolean;
}

export interface CourseSection {
    _id?: string;
    title: string;
    description?: string;
    order: number;
    subsections?: CourseSubsection[];
}

export interface CourseSubsection {
    _id?: string;
    title: string;
    description?: string;
    order: number;
    content?: CourseContentItem[];
}

export interface CourseContentItem {
    _id: string;
    type: 'video' | 'article' | 'quiz' | 'assignment';
    title: string;
    description?: string;
    videoUrl?: string;
    articleContent?: string;
    duration?: string;
    isFree: boolean;
    order: number;
}

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    isCompleted: boolean;
    isLocked: boolean;
    videoUrl?: string;
}

export interface CurriculumSection {
    id: string;
    title: string;
    lessons: Lesson[];
}

// Video types
export interface VideoProgress {
    courseId: string;
    lessonId: string;
    progress: number;
    lastWatched: Date;
}

// Notes types
export interface Note {
    id: string;
    title: string;
    courseId: string;
    subjectId?: string;     // Subject within class-course
    subjectName?: string;   // e.g. "Mathematics"
    fileName: string;
    fileUrl: string;
    fileSize: string;
    uploadedAt: Date;
    thumbnail?: string;
}

// Certificate types
export interface Certificate {
    id: string;
    courseId: string;
    courseName: string;
    studentName: string;
    issuedDate: Date;
    certificateUrl: string;
}

// Dashboard types
export interface StudentStats {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalWatchTime: number;
    certificates: number;
}

// Toast notification types
export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

// Doubt types
export interface Doubt {
    id?: string;
    _id?: string;
    studentId: string;
    studentName: string;
    courseId?: string;
    courseName?: string;
    subject: string;
    description: string;
    category: 'course' | 'general' | 'technical' | 'other';
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'resolved';
    response?: string;
    respondedBy?: string;
    respondedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface DoubtStatistics {
    totalDoubts: number;
    pendingDoubts: number;
    inProgressDoubts: number;
    resolvedDoubts: number;
    resolvedToday: number;
    averageResponseTime: number;
    doubtsByCategory: Array<{ category: string; count: number }>;
    doubtsByCourse: Array<{ courseName: string; count: number }>;
}

// Quiz types
export interface QuizSettings {
    marksPerQuestion: number;
    negativeMarking: number;
    timeLimit: number; // in minutes
    passingPercentage?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResultsImmediately?: boolean;
    allowRetake?: boolean;
    maxAttempts?: number;
}

export interface QuestionOption {
    id: string;
    text: string;
    imageUrl?: string;
}

export interface MatchPair {
    left: string;
    right: string;
}

export interface QuizQuestion {
    _id?: string;
    questionType: 'text' | 'image' | 'formula' | 'diagram' | 'match';
    questionText: string;
    questionImage?: string;
    questionFormula?: string;
    questionDiagram?: string;
    options: QuestionOption[];
    correctAnswer: string;
    matchPairs?: MatchPair[];
    explanation: string;
    marks: number;
    negativeMarks?: number;
    order: number;
}

export interface Quiz {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    subjectId?: string;     // Subject within class-course
    subjectName?: string;   // e.g. "Mathematics"
    totalQuestions: number;
    settings: QuizSettings;
    questions: QuizQuestion[];
    isPublished: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface QuizAnswer {
    questionId: string;
    selectedAnswer: string;
    isCorrect?: boolean;
    marksAwarded?: number;
    timeTaken?: number;
}

export interface QuizAttempt {
    _id?: string;
    id?: string;
    quizId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    answers: QuizAnswer[];
    status: 'in-progress' | 'completed' | 'abandoned' | 'expired';
    startedAt: Date;
    submittedAt?: Date;
    timeTaken?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface QuestionResult {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
}

export interface QuizResult {
    _id?: string;
    id?: string;
    attemptId: string;
    quizId: string;
    quizTitle: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    courseId: string;
    courseName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    isPassed: boolean;
    timeTaken: number;
    rank?: number;
    questionResults: QuestionResult[];
    feedback?: string;
    evaluatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeaderboardEntry {
    rank: number;
    studentName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    attemptDate: Date;
}

export interface QuizWithStatus extends Quiz {
    attemptCount?: number;
    status?: 'in-progress' | 'completed' | 'not-attempted';
    lastScore?: number;
    lastPercentage?: number;
    inProgressAttemptId?: string;
}

