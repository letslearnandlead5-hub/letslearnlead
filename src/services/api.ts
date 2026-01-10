import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Get token from Zustand persist storage
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                const token = parsed?.state?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error parsing auth storage:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Check if user was authenticated by checking Zustand storage
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                try {
                    const parsed = JSON.parse(authStorage);
                    const token = parsed?.state?.token;
                    if (token) {
                        // Token expired or invalid - clear auth and redirect
                        localStorage.removeItem('auth-storage');
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('Error parsing auth storage:', error);
                }
            }
            // If no token, just reject without redirect (user wasn't logged in)
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth APIs
export const authAPI = {
    signup: (data: { name: string; email: string; password: string; role?: string }) =>
        api.post('/auth/signup', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Course APIs
export const courseAPI = {
    getAll: (params?: { category?: string; level?: string; search?: string }) =>
        api.get('/courses', { params }),
    getById: (id: string) => api.get(`/courses/${id}`),
    create: (data: any) => api.post('/courses', data),
    update: (id: string, data: any) => api.put(`/courses/${id}`, data),
    delete: (id: string) => api.delete(`/courses/${id}`),
    enroll: (id: string) => api.post(`/courses/${id}/enroll`),
    getEnrolled: () => api.get('/courses/enrolled/my-courses'),
};


// Notes APIs
export const noteAPI = {
    getAll: (params?: { courseId?: string; fileType?: string; category?: string; search?: string }) =>
        api.get('/notes', { params }),
    getById: (id: string) => api.get(`/notes/${id}`),
    create: (data: any) => {
        // Check if data is FormData (file upload)
        if (data instanceof FormData) {
            return api.post('/notes', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        return api.post('/notes', data);
    },
    update: (id: string, data: any) => {
        // Check if data is FormData (file upload)
        if (data instanceof FormData) {
            return api.put(`/notes/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }
        return api.put(`/notes/${id}`, data);
    },
    delete: (id: string) => api.delete(`/notes/${id}`),
    getByCourse: (courseId: string) => api.get(`/notes/course/${courseId}`),
};

// Shop APIs
export const shopAPI = {
    products: {
        getAll: (params?: { category?: string; search?: string }) =>
            api.get('/shop/products', { params }),
        getById: (id: string) => api.get(`/shop/products/${id}`),
    },
    orders: {
        create: (data: any) => api.post('/shop/orders', data),
        getAll: () => api.get('/shop/orders'),
        getById: (id: string) => api.get(`/shop/orders/${id}`),
        update: (id: string, data: any) => api.put(`/shop/orders/${id}`, data),
    },
    payment: {
        createOrder: (data: { items: any[]; shippingAddress: any; totalAmount: number }) =>
            api.post('/shop/create-payment-order', data),
        verifyPayment: (data: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            dbOrderId: string;
        }) => api.post('/shop/verify-payment', data),
    },
};

// Notification APIs
export const notificationAPI = {
    getAll: (params?: { limit?: number; unreadOnly?: boolean }) =>
        api.get('/notifications', { params }),
    create: (data: { title: string; message: string; type: string; recipientType?: string; userId?: string }) =>
        api.post('/notifications/create', data),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Admin APIs
export const adminAPI = {
    // User Management
    users: {
        getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
            api.get('/admin/users', { params }),
        update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
        delete: (id: string) => api.delete(`/admin/users/${id}`),
    },
    // Analytics
    analytics: {
        overview: () => api.get('/admin/analytics/overview'),
        revenue: (period?: string) => api.get('/admin/analytics/revenue', { params: { period } }),
    },
    // Order Management
    orders: {
        getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
            api.get('/admin/orders', { params }),
        updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
    },
    // Product Management
    products: {
        create: (data: any) => api.post('/admin/products', data),
        update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
        delete: (id: string) => api.delete(`/admin/products/${id}`),
    },
};

// Payment APIs
export const paymentAPI = {
    createOrder: (courseId: string) => api.post('/payment/create-order', { courseId }),
    verifyPayment: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        enrollmentId?: string;
    }) => api.post('/payment/verify', data),
    handleFailure: (razorpay_order_id: string) =>
        api.post('/payment/failure', { razorpay_order_id }),
    checkEnrollment: (courseId: string) =>
        api.get(`/payment/check-enrollment/${courseId}`),
    freeEnroll: (courseId: string) =>
        api.post('/payment/free-enroll', { courseId }),
};

// Settings APIs
export const settingsAPI = {
    get: () => api.get('/settings'),
    update: (data: { emailNotifications?: boolean; maintenanceMode?: boolean; userRegistration?: boolean }) =>
        api.put('/settings', data),
};

// Stats APIs (Public)
export const statsAPI = {
    getPublicStats: () => api.get('/stats/public'),
};

export default api;
