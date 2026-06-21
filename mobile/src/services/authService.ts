import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { LoginPayload, RegisterPayload, UpdateProfilePayload, ApiResponse, User } from '../types';

export const authService = {
  login: async (payload: LoginPayload): Promise<ApiResponse<User>> => {
    const { data } = await api.post(ENDPOINTS.AUTH.LOGIN, payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<User>> => {
    const { data } = await api.post(ENDPOINTS.AUTH.SIGNUP, payload);
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await api.get(ENDPOINTS.AUTH.ME);
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiResponse<User>> => {
    const { data } = await api.put(ENDPOINTS.AUTH.PROFILE, payload);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    const { data } = await api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return data;
  },

  deleteAccount: async (): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(ENDPOINTS.AUTH.DELETE_ACCOUNT);
    return data;
  },
};
