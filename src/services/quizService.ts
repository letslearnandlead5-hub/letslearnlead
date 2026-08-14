/**
 * quizService.ts
 *
 * All quiz API calls now go through the shared `api` axios instance (api.ts).
 * This gives them:
 *  - Automatic token attachment via request interceptor
 *  - Automatic silent token refresh on TOKEN_EXPIRED (401) via response interceptor
 *  - Proper session-expiry UI on DEVICE_MISMATCH / SESSION_INVALIDATED
 *
 * Previously this file used raw axios with manual getAuthHeader() extraction,
 * which had NO refresh logic — causing admin logout after the 15-min access token
 * expired while editing a quiz.
 */
import api from './api';
import type { Quiz, QuizAttempt, QuizResult, LeaderboardEntry, QuizWithStatus } from '../types';

// NOTE: The `api` instance (api.ts) intercepts responses and returns `response.data`
// directly, so the shape received here is the server's JSON body (e.g. { success, data }).

// ==================== ADMIN API ====================

export const createQuiz = async (
    quizData: Partial<Quiz> & { status?: 'draft' | 'published'; draftMeta?: any; autosave?: boolean }
) => {
    const response: any = await api.post('/quizzes', quizData);
    return response.data;
};

/** Create a quiz for multiple courses simultaneously */
export const createMultiCourseQuiz = async (
    payload: Partial<Quiz> & {
        courseIds: string[];
        subjectName: string;
        categoryName?: string;
        status?: 'draft' | 'published';
        draftMeta?: any;
    }
) => {
    const response: any = await api.post('/quizzes/multi-course', payload);
    return response;
};

/** Copy an existing quiz to selected target courses */
export const copyQuizToCourses = async (quizId: string, targetCourseIds: string[]) => {
    const response: any = await api.post(`/quizzes/${quizId}/copy-to-courses`, { targetCourseIds });
    return response;
};

/** Alias for creating a brand-new draft */
export const createDraft = createQuiz;

/**
 * Save (autosave or manual) an existing draft quiz.
 * Sends autosave=true flag so server returns a lightweight response.
 */
export const saveDraft = async (
    quizId: string,
    payload: Partial<Quiz> & { draftMeta?: any; autosave?: boolean }
) => {
    const response: any = await api.put(`/quizzes/${quizId}`, payload);
    return response.data;
};

export const getAllQuizzes = async (filters?: {
    courseId?: string;
    isPublished?: boolean;
    status?: 'draft' | 'published' | 'archived' | 'all';
}) => {
    const params = new URLSearchParams();
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
    } else if (filters?.isPublished !== undefined) {
        params.append('isPublished', String(filters.isPublished));
    }

    const response: any = await api.get(`/quizzes?${params.toString()}`);
    return response.data;
};

export const getQuizById = async (quizId: string, isAdmin: boolean = false) => {
    const endpoint = isAdmin ? `/quizzes/${quizId}/admin` : `/quizzes/${quizId}/preview`;
    const response: any = await api.get(endpoint);
    return response.data;
};

export const updateQuiz = async (quizId: string, quizData: Partial<Quiz>) => {
    const response: any = await api.put(`/quizzes/${quizId}`, quizData);
    return response.data;
};

export const deleteQuiz = async (quizId: string) => {
    const response: any = await api.delete(`/quizzes/${quizId}`);
    return response;
};

/** Publish a quiz — server runs full validation */
export const publishQuiz = async (quizId: string, isPublished: boolean) => {
    const response: any = await api.post(`/quizzes/${quizId}/publish`, { isPublished });
    return response;
};

/** Archive a quiz (hidden from students) */
export const archiveQuiz = async (quizId: string) => {
    const response: any = await api.post(`/quizzes/${quizId}/archive`, {});
    return response;
};

/** Restore an archived quiz back to draft */
export const restoreQuiz = async (quizId: string) => {
    const response: any = await api.post(`/quizzes/${quizId}/restore`, {});
    return response;
};

/** Acquire an edit lock (concurrency control) */
export const lockQuiz = async (quizId: string) => {
    const response: any = await api.post(`/quizzes/${quizId}/lock`, {});
    return response;
};

/** Release an edit lock */
export const unlockQuiz = async (quizId: string) => {
    const response: any = await api.delete(`/quizzes/${quizId}/lock`);
    return response;
};

export const getQuizResults = async (quizId: string) => {
    const response: any = await api.get(`/quizzes/${quizId}/results`);
    return response;
};

export const getQuizAnalytics = async (quizId: string) => {
    const response: any = await api.get(`/quizzes/${quizId}/analytics`);
    return response.data;
};

export const repairQuizMarks = async (quizId: string) => {
    const response: any = await api.post(`/quizzes/${quizId}/repair-marks`, {});
    return response;
};

// ==================== STUDENT API ====================

export const getAvailableQuizzes = async (): Promise<QuizWithStatus[]> => {
    const response: any = await api.get('/quizzes/available/my');
    // Server returns `status` (in-progress|completed|not-attempted) from the student route.
    // We remap it to `attemptStatus` so it doesn't collide with the admin-side Quiz.status
    // (draft|published|archived) that was added as part of the Quiz lifecycle feature.
    return (response.data as any[]).map((q: any) => ({
        ...q,
        attemptStatus: q.status as 'in-progress' | 'completed' | 'not-attempted',
    })) as QuizWithStatus[];
};

export const getQuizPreview = async (quizId: string) => {
    const response: any = await api.get(`/quizzes/${quizId}/preview`);
    return response.data;
};

export const startQuizAttempt = async (quizId: string) => {
    const response: any = await api.post(`/quizzes/${quizId}/start`, {});
    return response.data;
};

export const saveQuizAnswer = async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string
) => {
    const response: any = await api.put(`/quizzes/attempts/${attemptId}/answer`, {
        questionId,
        selectedAnswer,
    });
    return response;
};

export const submitQuiz = async (attemptId: string) => {
    const response: any = await api.post(`/quizzes/attempts/${attemptId}/submit`, {});
    return response;
};

export const getQuizResult = async (attemptId: string) => {
    const response: any = await api.get(`/quizzes/attempts/${attemptId}/result`);
    return response.data;
};

export const getQuizLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
    const response: any = await api.get(`/quizzes/${quizId}/leaderboard`);
    return response.data;
};

// Helper function to format time
export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
};

// Helper function to format time remaining
export const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
