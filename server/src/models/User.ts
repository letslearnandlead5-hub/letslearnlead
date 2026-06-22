import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    phone?: string;
    profilePicture?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    grade?: string;
    stream?: string;
    institution?: string;
    subjectInterests?: string[];
    enrolledCourses: mongoose.Types.ObjectId[];
    isBlocked?: boolean;
    // ── Single Device Login fields ──────────────────────────────────────
    currentDeviceId?: string;        // UUID fingerprint of the active browser
    activeSessionToken?: string;     // SHA-256 hash of the active refresh token
    lastLoginAt?: Date;              // Timestamp of last successful login
    deviceInfo?: string;             // User-agent string at login time
    ipAddress?: string;              // IP address at login time
    sessionStatus?: 'active' | 'invalidated'; // Explicit session state
    // ────────────────────────────────────────────────────────────────────
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student',
        },
        phone: {
            type: String,
        },
        profilePicture: {
            type: String,
        },
        address: {
            type: String,
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        zipCode: {
            type: String,
        },
        grade: {
            type: String,
        },
        stream: {
            type: String,
        },
        institution: {
            type: String,
        },
        subjectInterests: {
            type: [String],
            default: [],
        },
        enrolledCourses: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Course',
            },
        ],
        isBlocked: {
            type: Boolean,
            default: false,
        },
        // ── Single Device Login fields ──────────────────────────────────
        currentDeviceId: {
            type: String,
            select: false, // Not included in default queries — must be explicitly selected
        },
        activeSessionToken: {
            type: String,
            select: false, // Sensitive — never expose to client
        },
        lastLoginAt: {
            type: Date,
        },
        deviceInfo: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        sessionStatus: {
            type: String,
            enum: ['active', 'invalidated'],
            default: null,
        },
        // ────────────────────────────────────────────────────────────────
    },
    {
        timestamps: true,
    }
);

// Add index for enrolledCourses to speed up aggregation queries
UserSchema.index({ enrolledCourses: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
