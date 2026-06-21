import api from './api';

export interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  discount: string;
  cta: string;
  image: string;
  bgGradient: [string, string];
  actionType: 'category' | 'course' | 'search';
  actionId?: string;
  actionName?: string;
  actionQuery?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerResponse {
  success: boolean;
  count: number;
  data: Banner[];
}

export const bannerService = {
  getActiveBanners: async (): Promise<BannerResponse> => {
    try {
      const response = await api.get('/banners');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch banners:', error);
      throw error;
    }
  },
};
