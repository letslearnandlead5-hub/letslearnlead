import mongoose, { Document, Schema } from 'mongoose';

// Question Option
export interface IQuestionOption {
    id: string;
    text: string;
    imageUrl?: string;
}

// Match pair for Match the Following questions
export interface IMatchPair {
    id: string;    // Stable client-side UUID assigned at creation
    left: string;  // Column A item (may contain rich HTML)
    right: string; // Column B item — correct match (may contain rich HTML)
    order: number; // Display order
}

// Quiz Question
export interface IQuizQuestion {
    _id?: mongoose.Types.ObjectId;
    questionType: 'text' | 'image' | 'formula' | 'diagram' | 'match';
    questionText: string;
    questionImage?: string;
    questionFormula?: string; // LaTeX formula
    questionDiagram?: string; // URL to diagram image
    options: IQuestionOption[];
    correctAnswer: string; // ID of the correct option (unused for match type)
    matchPairs?: IMatchPair[]; // Used only for 'match' question type
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

// Draft metadata for resume functionality
export interface IQuizDraftMeta {
    currentStep?: number;              // 1 | 2 | 3 | 4 — which wizard step admin was on
    currentQuestionIndex?: number;     // which question was being edited
    lastAutosavedAt?: Date;
    autosaveCount?: number;
    isAutosaved?: boolean;
}

// Audit log entry
export interface IQuizAuditEntry {
    action: 'created' | 'autosaved' | 'edited' | 'published' | 'archived' | 'restored';
    adminId: mongoose.Types.ObjectId;
    adminName?: string;
    timestamp: Date;
    meta?: Record<string, any>;
}

// Concurrency lock
export interface IQuizLock {
    adminId: mongoose.Types.ObjectId;
    adminName: string;
    lockedAt: Date;
}

export interface IQuiz extends Document {
    title: string;
    description: string;
    courseId: mongoose.Types.ObjectId;
    courseName: string;
    subjectId?: mongoose.Types.ObjectId;
    subjectName?: string;
    categoryId?: mongoose.Types.ObjectId;
    categoryName?: string;
    totalQuestions: number;
    settings: IQuizSettings;
    questions: IQuizQuestion[];
    /** 3-state status replaces the old isPublished boolean */
    status: 'draft' | 'published' | 'archived';
    /** Virtual for backward compat with student routes */
    readonly isPublished: boolean;
    draftMeta?: IQuizDraftMeta;
    lockedBy?: IQuizLock;
    auditLog: IQuizAuditEntry[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Question Option Schema
const QuestionOptionSchema = new Schema<IQuestionOption>(
    {
        id: { type: String, required: true },
        text: { type: String, default: '' },
        imageUrl: { type: String },
    },
    { _id: false }
);

// Match Pair Schema
const MatchPairSchema = new Schema<IMatchPair>({
    id: { type: String, default: '' },
    left: { type: String, default: '' },
    right: { type: String, default: '' },
    order: { type: Number, default: 0 },
});

// Quiz Question Schema — validators are RELAXED so drafts can be saved partially.
// Full validation happens at publish-time in the route layer.
const QuizQuestionSchema = new Schema<IQuizQuestion>({
    questionType: {
        type: String,
        enum: ['text', 'image', 'formula', 'diagram', 'match'],
        default: 'text',
    },
    questionText: { type: String, default: '' },
    questionImage: { type: String },
    questionFormula: { type: String },
    questionDiagram: { type: String },
    options: {
        type: [QuestionOptionSchema],
        default: [],
    },
    correctAnswer: { type: String, default: '' },
    matchPairs: {
        type: [MatchPairSchema],
        default: undefined,
    },
    explanation: { type: String, default: '' },
    marks: { type: Number, default: 4, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
});

// Quiz Settings Schema — also relaxed for draft saves
const QuizSettingsSchema = new Schema<IQuizSettings>({
    marksPerQuestion: { type: Number, default: 4, min: 0 },
    negativeMarking: { type: Number, default: 0, min: 0 },
    timeLimit: { type: Number, default: 30, min: 0 },
    passingPercentage: { type: Number, default: 40, min: 0, max: 100 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResultsImmediately: { type: Boolean, default: true },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1 },
});

// Draft Meta Schema
const QuizDraftMetaSchema = new Schema<IQuizDraftMeta>(
    {
        currentStep: { type: Number, default: 1 },
        currentQuestionIndex: { type: Number, default: 0 },
        lastAutosavedAt: { type: Date },
        autosaveCount: { type: Number, default: 0 },
        isAutosaved: { type: Boolean, default: false },
    },
    { _id: false }
);

// Audit Log Entry Schema
const QuizAuditEntrySchema = new Schema<IQuizAuditEntry>(
    {
        action: {
            type: String,
            enum: ['created', 'autosaved', 'edited', 'published', 'archived', 'restored'],
            required: true,
        },
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        adminName: { type: String },
        timestamp: { type: Date, default: Date.now },
        meta: { type: Schema.Types.Mixed },
    },
    { _id: false }
);

// Lock Schema
const QuizLockSchema = new Schema<IQuizLock>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        adminName: { type: String, required: true },
        lockedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

// Quiz Schema
const QuizSchema = new Schema<IQuiz>(
    {
        title: { type: String, default: '', trim: true },
        description: { type: String, default: '' },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
        courseName: { type: String, default: '' },
        subjectId: { type: Schema.Types.ObjectId },
        subjectName: { type: String, default: '' },
        categoryId: { type: Schema.Types.ObjectId, ref: 'QuizCategory' },
        categoryName: { type: String, default: '' },
        totalQuestions: { type: Number, default: 0 },
        settings: { type: QuizSettingsSchema, default: () => ({}) },
        questions: { type: [QuizQuestionSchema], default: [] },
        // 3-state status (replaces isPublished boolean)
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true,
        },
        draftMeta: { type: QuizDraftMetaSchema, default: () => ({}) },
        lockedBy: { type: QuizLockSchema, default: undefined },
        // Capped at 50 entries to keep document size manageable
        auditLog: { type: [QuizAuditEntrySchema], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    }
);

// ── Virtual: isPublished (backward compat for student routes) ─────────────────
QuizSchema.virtual('isPublished').get(function (this: IQuiz) {
    return this.status === 'published';
});

// Ensure virtuals are included when serialising to JSON/Object
QuizSchema.set('toJSON', { virtuals: true });
QuizSchema.set('toObject', { virtuals: true });

// ── Indexes ────────────────────────────────────────────────────────────────────
QuizSchema.index({ courseId: 1, status: 1 });
QuizSchema.index({ courseId: 1, subjectId: 1, status: 1 });
QuizSchema.index({ createdBy: 1, status: 1 });
QuizSchema.index({ status: 1, updatedAt: -1 });
QuizSchema.index({ title: 'text', description: 'text' });

// ── Pre-save hook: keep totalQuestions in sync ─────────────────────────────────
QuizSchema.pre('save', function (next) {
    this.totalQuestions = this.questions.length;
    // Cap auditLog at 50 entries
    if (this.auditLog.length > 50) {
        this.auditLog = this.auditLog.slice(this.auditLog.length - 50);
    }
    next();
});

export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
