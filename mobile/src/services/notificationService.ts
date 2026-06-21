import api from './api';
import { ENDPOINTS } from '../config/api.config';
import { Notification } from '../types';

export const notificationService = {
  getNotifications: async (
    limit = 20,
    unreadOnly = false
  ): Promise<{ success: boolean; data: Notification[]; unreadCount: number }> => {
    const { data } = await api.get(ENDPOINTS.NOTIFICATIONS.LIST, {
      params: { limit, unreadOnly: unreadOnly ? 'true' : undefined },
    });
    return data;
  },

  markRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return data;
  },

  markAllRead: async (): Promise<{ success: boolean }> => {
    const { data } = await api.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return data;
  },
};
