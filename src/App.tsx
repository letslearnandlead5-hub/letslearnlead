import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import StudentHeader from './components/layout/StudentHeader';
import StudentFooter from './components/layout/StudentFooter';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Maintenance from './pages/Maintenance';
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CoursesList from './pages/courses/CoursesList';
import CourseDetails from './pages/courses/CourseDetails';
import MyCourses from './pages/courses/MyCourses';
import CoursePurchase from './pages/courses/CoursePurchase';
import CoursePaymentSuccess from './pages/courses/CoursePaymentSuccess';
import CoursePaymentFailed from './pages/courses/CoursePaymentFailed';
import ProductsList from './pages/shop/ProductsList';
import Cart from './pages/shop/Cart';
import VideoPlayer from './pages/video/VideoPlayer';
import NotesLibrary from './pages/notes/NotesLibrary';
import CourseEditor from './pages/admin/CourseEditor';
import ProductEditor from './pages/admin/ProductEditor';
import NotificationEditor from './pages/admin/NotificationEditor';
import NoteEditor from './pages/admin/NoteEditor';
import ProductDetails from './pages/shop/ProductDetails';
import Checkout from './pages/shop/Checkout';
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';
import OrderTracker from './pages/shop/OrderTracker';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import DashboardRouter from './pages/DashboardRouter';
import Toast from './components/ui/Toast';
import { useToastStore } from './store/useToastStore';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import MyDoubts from './pages/doubts/MyDoubts';
import SubmitDoubt from './pages/doubts/SubmitDoubt';
import MyQuizzes from './pages/quizzes/MyQuizzes';
import QuizAttempt from './pages/quizzes/QuizAttempt';
import QuizResultView from './pages/quizzes/QuizResultView';
import QuizLeaderboard from './pages/quizzes/QuizLeaderboard';
import QuizList from './pages/admin/QuizList';
import QuizEditor from './pages/admin/QuizEditor';
import QuizResults from './pages/admin/QuizResults';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Layout wrapper for routes with Header/Footer
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

// Layout wrapper for student-specific pages with StudentHeader/StudentFooter
const StudentLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <StudentHeader />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
      <StudentFooter />
    </div>
  );
};

function App() {
  const { setTheme } = useThemeStore();
  const { checkAuth, user } = useAuthStore();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme === 'dark');
    }

    // Check authentication on app load
    checkAuth();

    // Check maintenance mode
    checkMaintenanceMode();
  }, [setTheme, checkAuth]);

  const checkMaintenanceMode = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/settings`);
      const data = await response.json();
      
      // Only show maintenance page if not admin
      if (data.success && data.data.maintenanceMode && user?.role !== 'admin') {
        setMaintenanceMode(true);
      } else {
        setMaintenanceMode(false);
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setMaintenanceMode(false);
    } finally {
      setCheckingMaintenance(false);
    }
  };

  const { toasts } = useToastStore();

  // Show loading while checking maintenance
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show maintenance page if enabled (except for admins)
  if (maintenanceMode && user?.role !== 'admin') {
    return <Maintenance />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Admin Routes - No Header/Footer */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />

          {/* Admin Course Editor Routes */}
          <Route path="/admin/courses/new" element={
            <ProtectedRoute requiredRole="admin">
              <CourseEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/courses/edit/:id" element={
            <ProtectedRoute requiredRole="admin">
              <CourseEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/note-editor/:id?" element={
            <ProtectedRoute requiredRole="admin">
              <NoteEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/quizzes" element={
            <ProtectedRoute requiredRole="admin">
              <QuizList />
            </ProtectedRoute>
          } />
          <Route path="/admin/quizzes/new" element={
            <ProtectedRoute requiredRole="admin">
              <QuizEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/quizzes/edit/:id" element={
            <ProtectedRoute requiredRole="admin">
              <QuizEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/quizzes/:id/results" element={
            <ProtectedRoute requiredRole="admin">
              <QuizResults />
            </ProtectedRoute>
          } />

          {/* Admin Product Editor Routes */}
          <Route path="/products/create" element={
            <ProtectedRoute requiredRole="admin">
              <ProductEditor />
            </ProtectedRoute>
          } />
          <Route path="/products/edit/:id" element={
            <ProtectedRoute requiredRole="admin">
              <ProductEditor />
            </ProtectedRoute>
          } />

          {/* Admin Notification Editor Route */}
          <Route path="/notifications/create" element={
            <ProtectedRoute requiredRole="admin">
              <NotificationEditor />
            </ProtectedRoute>
          } />

          {/* Admin Note Editor Routes */}
          <Route path="/notes/create" element={
            <ProtectedRoute requiredRole="admin">
              <NoteEditor />
            </ProtectedRoute>
          } />
          <Route path="/notes/edit/:id" element={
            <ProtectedRoute requiredRole="admin">
              <NoteEditor />
            </ProtectedRoute>
          } />

          {/* Cart, Checkout, Payment & Order Routes - No Header/Footer */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/orders/:orderId" element={
            <ProtectedRoute>
              <OrderTracker />
            </ProtectedRoute>
          } />

          {/* Regular Routes - With Header/Footer */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/signup" element={<MainLayout><SignUp /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/auth/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
          <Route path="/auth/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
          <Route path="/courses" element={<MainLayout><CoursesList /></MainLayout>} />
          <Route path="/courses/:id" element={<MainLayout><CourseDetails /></MainLayout>} />
          <Route path="/courses/:id/purchase" element={<MainLayout><CoursePurchase /></MainLayout>} />
          <Route path="/courses/payment/success" element={<MainLayout><CoursePaymentSuccess /></MainLayout>} />
          <Route path="/courses/payment/failed" element={<MainLayout><CoursePaymentFailed /></MainLayout>} />
          <Route path="/my-courses" element={<StudentLayout><MyCourses /></StudentLayout>} />
          <Route path="/shop" element={<MainLayout><ProductsList /></MainLayout>} />
          <Route path="/shop/:id" element={<MainLayout><ProductDetails /></MainLayout>} />
          <Route path="/payment/success" element={<MainLayout><PaymentSuccess /></MainLayout>} />
          <Route path="/payment/failed" element={<MainLayout><PaymentFailed /></MainLayout>} />
          <Route path="/video/:courseId/:lessonId" element={<StudentLayout><VideoPlayer /></StudentLayout>} />
          <Route path="/notes" element={<StudentLayout><NotesLibrary /></StudentLayout>} />
          <Route path="/doubts" element={
            <ProtectedRoute>
              <StudentLayout><MyDoubts /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/doubts/submit" element={
            <ProtectedRoute>
              <StudentLayout><SubmitDoubt /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-quizzes" element={
            <ProtectedRoute>
              <StudentLayout><MyQuizzes /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/quizzes/:id/attempt" element={
            <ProtectedRoute>
              <StudentLayout><QuizAttempt /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/quizzes/:id/result/:attemptId" element={
            <ProtectedRoute>
              <StudentLayout><QuizResultView /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/quizzes/:id/leaderboard" element={
            <ProtectedRoute>
              <StudentLayout><QuizLeaderboard /></StudentLayout>
            </ProtectedRoute>
          } />
          <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
        </Routes>

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} />
          ))}
        </div>

        {/* React Hot Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '0.5rem',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
