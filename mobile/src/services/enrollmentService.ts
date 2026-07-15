import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Enrollment } from '../types';

export const enrollmentService = {
  /** Get all course-level enrollments for the logged-in student */
  getMyEnrollments: async (): Promise<{ success: boolean; data: Enrollment[]; count: number }> => {
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.MY_ENROLLMENTS);
    return data;
  },

  /** Verify if the logged-in student is enrolled in a specific course */
  verifyEnrollment: async (courseId: string): Promise<{ success: boolean; enrolled: boolean }> => {
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.VERIFY(courseId));
    return data;
  },

  /** Get the list of completed lesson IDs and overall % for a course */
  getCourseProgress: async (courseId: string, subjectId?: string): Promise<{
    success: boolean;
    completedLessons: string[];
    completionPercentage: number;
  }> => {
    const params = subjectId ? { subjectId } : {};
    const { data } = await api.get(ENDPOINTS.ENROLLMENT.PROGRESS(courseId), { params });
    return data;
  },

  /**
   * Save progress to the backend after completing a lesson.
   * completedLessons — full array of completed lesson _id strings
   * subjectId        — optional, only for subject-scoped progress
   */
  updateProgress: async (
    courseId: string,
    completedLessons: string[],
    subjectId?: string
  ): Promise<{ success: boolean }> => {
    const body: any = { completedLessons };
    if (subjectId) body.subjectId = subjectId;
    const { data } = await api.put(ENDPOINTS.ENROLLMENT.PROGRESS(courseId), body);
    return data;
  },
};
