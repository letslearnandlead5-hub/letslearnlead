import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import StudentDashboard from './dashboard/StudentDashboard';
import AdminDashboard from './admin/AdminDashboard';

const DashboardRouter: React.FC = () => {
    const { user } = useAuthStore();

    // Check user role and render appropriate dashboard
    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    // Default to student dashboard
    return <StudentDashboard />;
};

export default DashboardRouter;
