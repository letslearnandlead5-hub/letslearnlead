import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Doubt } from '../types';

export interface CreateDoubtPayload {
  subject: string;
  description: string;
  courseId?: string;
  courseName?: string;
  category?: Doubt['category'];
  priority?: Doubt['priority'];
}

export const doubtService = {
  /** Get the student's own doubts (paginated) */
  getMyDoubts: async (params?: {
    status?: string;
    courseId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    count: number;
    total: number;
    pages: number;
    data: Doubt[];
  }> => {
    const { data } = await api.get(ENDPOINTS.DOUBTS.LIST, { params });
    return data;
  },

  /** Submit a new doubt */
  createDoubt: async (payload: CreateDoubtPayload): Promise<{ success: boolean; data: Doubt }> => {
    const { data } = await api.post(ENDPOINTS.DOUBTS.CREATE, payload);
    return data;
  },

  /** Get a single doubt's details */
  getDoubt: async (id: string): Promise<{ success: boolean; data: Doubt }> => {
    const { data } = await api.get(ENDPOINTS.DOUBTS.DETAIL(id));
    return data;
  },
};
