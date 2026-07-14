const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.100:5000';

export const API_BASE_URL = `${BASE_URL}/api`;

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    DELETE_ACCOUNT: '/auth/delete-account',
    LOGOUT: '/auth/logout',
  },

  // Courses
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
    MY_COURSES: '/courses/enrolled/my-courses',
  },

  // Enrollment
  ENROLLMENT: {
    MY_ENROLLMENTS: '/enrollment/my-enrollments',
    VERIFY: (courseId: string) => `/enrollment/verify/${courseId}`,
    PROGRESS: (courseId: string) => `/enrollment/progress/${courseId}`,
  },

  // Progress
  PROGRESS: {
    SAVE: '/progress',
    GET_COURSE: (courseId: string) => `/progress/${courseId}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
} as const;
