import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Payment API
export const paymentAPI = {
    // Create Razorpay order
    createOrder: (courseId: string) => api.post('/payment/create-order', { courseId }),

    // Verify payment
    verifyPayment: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        enrollmentId?: string;
    }) => api.post('/payment/verify', data),

    // Handle payment failure
    handleFailure: (razorpay_order_id: string) =>
        api.post('/payment/failure', { razorpay_order_id }),

    // Check enrollment status
    checkEnrollment: (courseId: string) =>
        api.get(`/payment/check-enrollment/${courseId}`),

    // Free enrollment (when payment is disabled)
    freeEnroll: (courseId: string) =>
        api.post('/payment/free-enroll', { courseId }),
};
