import axios from 'axios';
import type { Doubt } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        try {
            const parsed = JSON.parse(authStorage);
            const token = parsed?.state?.token;
            return token ? `Bearer ${token}` : '';
        } catch {
            return '';
        }
    }
    return '';
};

// Create axios instance with auth header
const createAuthHeaders = () => ({
    headers: {
        Authorization: getAuthToken(),
    },
});

// ============================================
// STUDENT OPERATIONS
// ============================================

/**
 * Get student's own doubts with optional filters
 */
export const getMyDoubts = async (filters?: {
    status?: string;
    courseId?: string;
    category?: string;
    limit?: number;
    page?: number;
}) => {
    const response = await axios.get(`${API_URL}/doubts`, {
        ...createAuthHeaders(),
        params: filters,
    });
    return response.data;
};

/**
 * Create a new doubt
 */
export const createDoubt = async (doubtData: {
    subject: string;
    description: string;
    courseId?: string;
    courseName?: string;
    category?: 'course' | 'general' | 'technical' | 'other';
    priority?: 'low' | 'medium' | 'high';
}) => {
    const response = await axios.post(`${API_URL}/doubts`, doubtData, createAuthHeaders());
    return response.data;
};

/**
 * Get specific doubt details
 */
export const getDoubtById = async (id: string) => {
    const response = await axios.get(`${API_URL}/doubts/${id}`, createAuthHeaders());
    return response.data;
};

/**
 * Update a doubt (only if not yet responded)
 */
export const updateDoubt = async (
    id: string,
    updates: {
        subject?: string;
        description?: string;
        category?: 'course' | 'general' | 'technical' | 'other';
        priority?: 'low' | 'medium' | 'high';
    }
) => {
    const response = await axios.put(`${API_URL}/doubts/${id}`, updates, createAuthHeaders());
    return response.data;
};

/**
 * Delete own doubt (only if not responded)
 */
export const deleteDoubt = async (id: string) => {
    const response = await axios.delete(`${API_URL}/doubts/${id}`, createAuthHeaders());
    return response.data;
};

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Get all doubts with filters (admin only)
 */
export const getAllDoubts = async (filters?: {
    status?: string;
    courseId?: string;
    category?: string;
    priority?: string;
    studentId?: string;
    search?: string;
    limit?: number;
    page?: number;
}) => {
    const response = await axios.get(`${API_URL}/doubts/admin/all`, {
        ...createAuthHeaders(),
        params: filters,
    });
    return response.data;
};

/**
 * Respond to a doubt (admin only)
 */
export const respondToDoubt = async (
    id: string,
    responseData: {
        response: string;
        status?: 'pending' | 'in-progress' | 'resolved';
    }
) => {
    const response = await axios.put(
        `${API_URL}/doubts/admin/${id}/respond`,
        responseData,
        createAuthHeaders()
    );
    return response.data;
};

/**
 * Update doubt status (admin only)
 */
export const updateDoubtStatus = async (
    id: string,
    status: 'pending' | 'in-progress' | 'resolved'
) => {
    const response = await axios.put(
        `${API_URL}/doubts/admin/${id}/status`,
        { status },
        createAuthHeaders()
    );
    return response.data;
};

/**
 * Get doubt statistics (admin only)
 */
export const getDoubtStatistics = async () => {
    const response = await axios.get(`${API_URL}/doubts/admin/statistics`, createAuthHeaders());
    return response.data;
};

/**
 * Delete any doubt (admin privilege)
 */
export const deleteDoubtAdmin = async (id: string) => {
    const response = await axios.delete(`${API_URL}/doubts/admin/${id}`, createAuthHeaders());
    return response.data;
};

export const doubtAPI = {
    // Student operations
    getMyDoubts,
    createDoubt,
    getDoubtById,
    updateDoubt,
    deleteDoubt,

    // Admin operations
    getAllDoubts,
    respondToDoubt,
    updateDoubtStatus,
    getDoubtStatistics,
    deleteDoubtAdmin,
};
