import { z } from 'zod';

// MongoDB ObjectId validation
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Note validation schemas
export const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
    courseId: objectIdSchema,
    category: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
    fileType: z.enum(['html', 'file']),
    markdownContent: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
    fileType: z.enum(['html', 'file']).optional(),
});

// Auth validation schemas
export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100)
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter'),
    role: z.enum(['student', 'teacher', 'admin']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(20).optional(),
    profilePicture: z.string().url().optional(),
    address: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    grade: z.string().max(50).optional(),
    stream: z.string().max(100).optional(),
    institution: z.string().max(200).optional(),
    subjectInterests: z.array(z.string().max(100)).optional(),
});
