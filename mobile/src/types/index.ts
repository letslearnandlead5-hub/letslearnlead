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

// A subject inside a course (e.g. Mathematics, Science in a Class 9 bundle)
export interface CourseSubject {
  _id: string;
  name: string;
  icon?: string;        // emoji e.g. "📐"
  description?: string;
  price?: number;
  order?: number;
  sections?: CourseSection[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  paymentEnabled?: boolean;   // whether payment is required
  rating: number;
  studentsEnrolled: number;
  duration: string;
  category: string;
  grade?: string;             // e.g. "6th", "10th"
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  medium?: 'English' | 'Kannada';
  featuredOnHome?: boolean;
  // ── Content structure (one of these will be populated) ──────────────────────
  subjects?: CourseSubject[]; // multi-subject courses (new schema)
  sections?: CourseSection[]; // legacy single-section courses
  // ────────────────────────────────────────────────────────────────────────────
  quizId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────
export interface Enrollment {
  _id: string;
  courseId: Course | string;
  userId: string;
  subjectId?: string | null;           // null = course-level enrollment
  status: 'pending' | 'paid' | 'failed';
  completionPercentage: number;
  completedLessons?: string[];         // array of lesson _id strings
  isCourseLevelEnrolled?: boolean;     // true when enrolled in whole course
  enrolledSubjectIds?: string[];       // which subjects are unlocked
  purchaseDate: string;
  amount?: number;
  currency?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer?: string; // only present after submission
  marks: number;
  negativeMarks?: number;
}

export interface QuizSettings {
  timeLimit: number;           // minutes
  passingScore: number;        // percentage
  allowRetake: boolean;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  marksPerQuestion: number;
  negativeMarking: number;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName?: string;
  subjectId?: string;
  questions: QuizQuestion[];
  settings: QuizSettings;
  isPublished: boolean;
  createdAt?: string;
  // Extra fields from /available/my endpoint
  status?: 'not-attempted' | 'in-progress' | 'completed';
  attemptCount?: number;
  lastScore?: number | null;
  lastPercentage?: number | null;
  inProgressAttemptId?: string;
}

export interface QuizResultItem {
  _id: string;
  quizId: string;
  studentId: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number;       // seconds
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  createdAt: string;
}

// ─── Doubt ────────────────────────────────────────────────────────────────────
export interface Doubt {
  _id: string;
  studentId: string;
  studentName: string;
  subject: string;
  description: string;
  courseId?: string;
  courseName?: string;
  category: 'general' | 'technical' | 'academic' | 'payment' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  respondedBy?: { _id: string; name: string };
  respondedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Note ─────────────────────────────────────────────────────────────────────
export interface Note {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf' | 'txt';
  fileSize?: number;
  courseId?: string;
  courseName?: string;
  subjectId?: string;
  subjectName?: string;
  category?: string;
  tags?: string[];
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
}



// ─── Payment ──────────────────────────────────────────────────────────────────
export interface Payment {
  _id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: { _id: string; title: string; thumbnail?: string; instructor?: string; price?: number } | string;
  courseName: string;
  subjectId?: string | null;
  subjectName?: string;
  amount: number;
  currency: string;
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'approved' | 'rejected';
  adminRemark?: string;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentSummary {
  pending: number;
  approved: number;
  rejected: number;
}

// ─── Certificate (derived from enrollment — no dedicated API yet) ─────────────
export interface Certificate {
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  instructor?: string;
  completionDate: string;       // from enrollment createdAt or purchaseDate
  completionPercentage: number; // must be 100 to show
  enrollmentId: string;
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
  forceLogout?: boolean;
  deviceId?: string;
  deviceInfo?: string;
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
  PracticeTab: undefined;
  DoubtsTab: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  CertificatesList: undefined;
  PaymentsList: undefined;
  PaymentSubmit: { courseId: string; courseTitle: string };
  NotesList: undefined;
};

export type QuizzesStackParamList = {
  QuizzesList: undefined;
  QuizAttempt: { quizId: string; quizTitle?: string; attemptId?: string };
};

export type DoubtsStackParamList = {
  DoubtsList: undefined;
  SubmitDoubt: undefined;
};

export type NotesStackParamList = {
  NotesList: undefined;
};

export type CertificatesStackParamList = {
  CertificatesList: undefined;
};

export type PaymentsStackParamList = {
  PaymentsList: undefined;
  PaymentSubmit: { courseId: string; courseTitle: string };
};

export type HomeStackParamList = {
  Home: undefined;
  Categories: undefined;
  CategoryCourses: { categoryId: string; categoryName: string };
  CourseDetail: { courseId: string; courseTitle?: string };
  SubjectSelection: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string; subjectId?: string };
  Notifications: undefined;
  NotificationDetail: { notification: Notification };
  Search: { initialQuery?: string };
  PaymentSubmit: { courseId: string; courseTitle: string };
};

export type MyCoursesStackParamList = {
  MyCoursesList: undefined;
  CourseDetail: { courseId: string; courseTitle?: string };
  SubjectSelection: { courseId: string; courseTitle?: string };
  VideoPlayer: { courseId: string; lessonId: string; lessonTitle?: string; subjectId?: string };
  PaymentSubmit: { courseId: string; courseTitle: string };
};
