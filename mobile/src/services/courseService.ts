import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Course, CourseFilters, ApiResponse } from '../types';

export const courseService = {
  getCourses: async (filters?: CourseFilters): Promise<{ success: boolean; data: Course[]; count: number }> => {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.level) params.level = filters.level;
    if (filters?.search) params.search = filters.search;
    if (filters?.medium) params.medium = filters.medium;
    if (filters?.featured) params.featured = filters.featured;
    if (filters?.grade) params.grade = filters.grade;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);

    const { data } = await api.get(ENDPOINTS.COURSES.LIST, { params });
    return data;
  },

  getCourseById: async (id: string): Promise<ApiResponse<Course>> => {
    const { data } = await api.get(ENDPOINTS.COURSES.DETAIL(id));
    return data;
  },

  enrollInCourse: async (id: string): Promise<ApiResponse<Course>> => {
    const { data } = await api.post(ENDPOINTS.COURSES.ENROLL(id));
    return data;
  },

  getEnrolledCourses: async (): Promise<{ success: boolean; data: Course[]; count: number }> => {
    const { data } = await api.get(ENDPOINTS.COURSES.MY_COURSES);
    return data;
  },

  markLessonComplete: async (courseId: string, lessonId: string): Promise<ApiResponse<any>> => {
    const { data } = await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return data;
  },
};
