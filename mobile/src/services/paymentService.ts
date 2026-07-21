import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Payment, PaymentSummary } from '../types';

export interface SubmitPaymentPayload {
  courseId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  transactionId: string;
  notes?: string;
}

export interface CoursePaymentInfo {
  _id: string;
  title: string;
  currency: string;
  paymentEnabled: boolean;
  paymentMethod?: string;
  upiId?: string;
  merchantName?: string;
  paymentInstructions?: string;
  qrImage?: string;
  price?: number;
  subjects?: Array<{ _id: string; name: string; price?: number }>;
}

export const paymentService = {
  /** Get all payment records for the logged-in student */
  getMyPayments: async (): Promise<{
    success: boolean;
    data: Payment[];
    summary: PaymentSummary;
  }> => {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.MY);
    return data;
  },

  /** Check payment status for a specific course */
  getPaymentStatus: async (courseId: string): Promise<{
    success: boolean;
    data: Payment | null;
    status: 'none' | 'pending' | 'approved' | 'rejected';
  }> => {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.STATUS(courseId));
    return data;
  },

  /** Get course payment info (QR, UPI, instructions) */
  getCoursePaymentInfo: async (courseId: string): Promise<{
    success: boolean;
    data: CoursePaymentInfo;
    message?: string;
  }> => {
    const { data } = await api.get(ENDPOINTS.PAYMENTS.COURSE_INFO(courseId));
    return data;
  },

  /** Submit payment details after QR scan */
  submitPayment: async (payload: SubmitPaymentPayload): Promise<{
    success: boolean;
    message: string;
    data: { _id: string; paymentStatus: string };
  }> => {
    const { data } = await api.post(ENDPOINTS.PAYMENTS.SUBMIT, payload);
    return data;
  },
};
