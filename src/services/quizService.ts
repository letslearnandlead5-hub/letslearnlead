import axios from 'axios';
import type { Quiz, QuizAttempt, QuizResult, LeaderboardEntry, QuizWithStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
    // Get token from Zustand persist storage (auth-storage)
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    
    if (authStorage) {
        try {
            const parsed = JSON.parse(authStorage);
            token = parsed?.state?.token;
            
            // Debug: Log token status
            if (!token) {
                console.error('No token found in auth-storage');
            }
        } catch (e) {
            console.error('Failed to parse auth-storage:', e);
        }
    } else {
        console.error('No auth-storage found in localStorage');
    }
    
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== ADMIN API ====================

export const createQuiz = async (quizData: Partial<Quiz>) => {
    const response = await axios.post(`${API_URL}/quizzes`, quizData, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const getAllQuizzes = async (filters?: { courseId?: string; isPublished?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.isPublished !== undefined) params.append('isPublished', String(filters.isPublished));

    const response = await axios.get(`${API_URL}/quizzes?${params.toString()}`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const getQuizById = async (quizId: string, isAdmin: boolean = false) => {
    const endpoint = isAdmin ? `${API_URL}/quizzes/${quizId}/admin` : `${API_URL}/quizzes/${quizId}/preview`;
    const response = await axios.get(endpoint, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const updateQuiz = async (quizId: string, quizData: Partial<Quiz>) => {
    const response = await axios.put(`${API_URL}/quizzes/${quizId}`, quizData, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const deleteQuiz = async (quizId: string) => {
    const response = await axios.delete(`${API_URL}/quizzes/${quizId}`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

export const publishQuiz = async (quizId: string, isPublished: boolean) => {
    const response = await axios.post(
        `${API_URL}/quizzes/${quizId}/publish`,
        { isPublished },
        {
            headers: getAuthHeader(),
        }
    );
    return response.data;
};

export const getQuizResults = async (quizId: string) => {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}/results`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

export const getQuizAnalytics = async (quizId: string) => {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}/analytics`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

// ==================== STUDENT API ====================

export const getAvailableQuizzes = async (): Promise<QuizWithStatus[]> => {
    const response = await axios.get(`${API_URL}/quizzes/available/my`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const getQuizPreview = async (quizId: string) => {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}/preview`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const startQuizAttempt = async (quizId: string) => {
    const response = await axios.post(
        `${API_URL}/quizzes/${quizId}/start`,
        {},
        {
            headers: getAuthHeader(),
        }
    );
    return response.data.data;
};

export const saveQuizAnswer = async (attemptId: string, questionId: string, selectedAnswer: string) => {
    const response = await axios.put(
        `${API_URL}/quizzes/attempts/${attemptId}/answer`,
        { questionId, selectedAnswer },
        {
            headers: getAuthHeader(),
        }
    );
    return response.data;
};

export const submitQuiz = async (attemptId: string) => {
    const response = await axios.post(
        `${API_URL}/quizzes/attempts/${attemptId}/submit`,
        {},
        {
            headers: getAuthHeader(),
        }
    );
    return response.data;
};

export const getQuizResult = async (attemptId: string) => {
    const response = await axios.get(`${API_URL}/quizzes/attempts/${attemptId}/result`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
};

export const getQuizLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}/leaderboard`, {
        headers: getAuthHeader(),
    });
    return response.data.data;
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
