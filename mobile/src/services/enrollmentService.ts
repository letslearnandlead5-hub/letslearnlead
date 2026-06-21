import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Enrollment } from '../types';

export const enrollmentService = {
  getMyEnrollments: async (): Promise<{ success: boolean; data: Enrollment[]; count: number }> => {
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.MY_ENROLLMENTS);
    return data;
  },

  verifyEnrollment: async (courseId: string): Promise<{ success: boolean; enrolled: boolean }> => {
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.VERIFY(courseId));
    return data;
  },

  getCourseProgress: async (courseId: string): Promise<{
    success: boolean;
    completedLessons: string[];
    completionPercentage: number;
  }> => {
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.PROGRESS(courseId));
    return data;
  },
};
