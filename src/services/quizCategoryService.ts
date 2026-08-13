import api from './api';
import type { QuizCategory } from '../types';

export const quizCategoryService = {
    /** Get active categories for course & optional subject */
    getCategories: async (courseId: string, subjectId?: string): Promise<QuizCategory[]> => {
        const params = new URLSearchParams({ courseId });
        if (subjectId) params.append('subjectId', subjectId);

        const response: any = await api.get(`/quiz-categories?${params.toString()}`);
        return response.data || [];
    },

    /** Get all categories for admin (including inactive) */
    getAdminCategories: async (courseId: string, subjectId?: string): Promise<QuizCategory[]> => {
        const params = new URLSearchParams({ courseId });
        if (subjectId) params.append('subjectId', subjectId);

        const response: any = await api.get(`/quiz-categories/admin?${params.toString()}`);
        return response.data || [];
    },

    /** Get categories by course */
    getCategoriesByCourse: async (courseId: string): Promise<QuizCategory[]> => {
        const response: any = await api.get(`/quiz-categories/by-course/${courseId}`);
        return response.data || [];
    },

    /** Create a new category */
    createCategory: async (categoryData: {
        courseId: string;
        subjectId?: string;
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        order?: number;
    }): Promise<QuizCategory> => {
        const response: any = await api.post('/quiz-categories', categoryData);
        return response.data;
    },

    /** Update existing category */
    updateCategory: async (
        id: string,
        categoryData: Partial<QuizCategory>
    ): Promise<QuizCategory> => {
        const response: any = await api.put(`/quiz-categories/${id}`, categoryData);
        return response.data;
    },

    /** Delete a category */
    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/quiz-categories/${id}`);
    },

    /** Reorder categories */
    reorderCategories: async (items: Array<{ id: string; order: number }>): Promise<void> => {
        await api.put('/quiz-categories/reorder', { items });
    },
};

export const getQuizCategories = (courseId: string, subjectId?: string) =>
    quizCategoryService.getCategories(courseId, subjectId);

