// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  profilePicture?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  grade?: string;
  stream?: string;
  institution?: string;
  subjectInterests?: string[];
  enrolledCourses?: string[];
  medium?: string;
  isBlocked?: boolean;
  createdAt?: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────
export interface CourseContent {
  _id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  videoUrl?: string;
  duration?: string;
}

export interface CourseSubsection {
  _id: string;
  title: string;
  content: CourseContent[];
}

export interface CourseSection {
  _id: string;
  title: string;
  subsections: CourseSubsection[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  rating: number;
  studentsEnrolled: number;
  duration: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  medium?: 'English' | 'Kannada';
  featuredOnHome?: boolean;
  sections?: CourseSection[];
  quizId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────
export interface Enrollment {
  _id: string;
  courseId: Course | string;
  userId: string;
  status: 'pending' | 'paid' | 'failed';
  completionPercentage: number;
  purchaseDate: string;
  amount?: number;
  currency?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  token?: string;
  user?: User;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  grade?: string;
  stream?: string;
  institution?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// ─── Course Filters ───────────────────────────────────────────────────────────
export interface CourseFilters {
  category?: string;
  level?: string;
  search?: string;
  medium?: string;
  featured?: string;
  grade?: string;
  page?: number;
  limit?: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  MyCoursesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Categories: undefined;
  CategoryCourses: { categoryId: string; categoryName: string };
  CourseDetail: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string };
  Notifications: undefined;
  NotificationDetail: { notification: Notification };
  Search: { initialQuery?: string };
};

export type MyCoursesStackParamList = {
  MyCoursesList: undefined;
  CourseDetail: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string };
};
