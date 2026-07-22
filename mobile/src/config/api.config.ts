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

  // Quizzes
  QUIZZES: {
    AVAILABLE: '/quizzes/available/my',
    PREVIEW: (id: string) => `/quizzes/${id}/preview`,
    START: (id: string) => `/quizzes/${id}/start`,
    SAVE_ANSWER: (attemptId: string) => `/quizzes/attempts/${attemptId}/answer`,
    SUBMIT: (attemptId: string) => `/quizzes/attempts/${attemptId}/submit`,
    LEADERBOARD: (id: string) => `/quizzes/${id}/leaderboard`,
  },

  // Doubts
  DOUBTS: {
    LIST: '/doubts',
    CREATE: '/doubts',
    DETAIL: (id: string) => `/doubts/${id}`,
  },

  // Notes
  NOTES: {
    LIST: '/notes',
    BY_COURSE: (courseId: string) => `/notes/course/${courseId}`,
    BY_SUBJECT: (courseId: string, subjectId: string) => `/notes/courses/${courseId}/subjects/${subjectId}/notes`,
    DETAIL: (id: string) => `/notes/${id}`,
    // Secure viewer: issues a short-lived signed token (never exposes fileUrl)
    VIEW_TOKEN: (id: string) => `/notes/${id}/view`,
    // Token-gated file stream URL (used by WebView — not called via axios)
    STREAM: (id: string, token: string) => `/notes/${id}/view/stream?token=${encodeURIComponent(token)}`,
    // My Notes grouped by course → subject
    MY_NOTES: '/notes/my-notes',
    // Log print event
    PRINT_LOG: (id: string) => `/notes/${id}/print-log`,
    // Admin/Teacher only — blocked for students
    DOWNLOAD: (id: string) => `/notes/${id}/download`,
  },



  // Payments
  PAYMENTS: {
    MY: '/payments/my',
    STATUS: (courseId: string) => `/payments/status/${courseId}`,
    SUBMIT: '/payments/submit',
    COURSE_INFO: (courseId: string) => `/payments/course/${courseId}`,
  },

  // Invoice
  INVOICE: {
    DOWNLOAD: (enrollmentId: string) => `/invoice/${enrollmentId}/download`,
  },
} as const;

