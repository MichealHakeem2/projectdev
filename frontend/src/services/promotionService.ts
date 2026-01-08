import api from './api';

export interface Promotion {
  _id: string;
  postId: string;
  businessId: string;
  budget: number;
  spent: number;
  duration: number;
  startDate: string;
  endDate: string;
  targetRegion?: string;
  targetCategory?: string;
  status: 'active' | 'paused' | 'completed';
  updatedAt: string;
  createdAt: string;
}

export interface TrendPromotion {
  tag: string;
  businessId?: string;
  budget: number;
  duration: number;
}

export interface PromotionAnalytics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spent: number;
  remaining: number;
  roi: number;
}

const promotionService = {
  createPromotion: async (data: {
    postId: string;
    businessId?: string;
    budget: number;
    duration: number;
    targetRegion?: string;
    targetCategory?: string;
  }): Promise<Promotion> => {
    const response = await api.post('/promotions', data);
    return response.data.data;
  },

  getPromotions: async (): Promise<Promotion[]> => {
    const response = await api.get('/promotions');
    return response.data.data;
  },

  getPromotionById: async (id: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data.data;
  },

  getPromotionAnalytics: async (id: string): Promise<PromotionAnalytics> => {
    const response = await api.get(`/promotions/${id}/analytics`);
    return response.data.data;
  },

  updatePromotionBudget: async (id: string, budget: number): Promise<Promotion> => {
    const response = await api.patch(`/promotions/${id}`, { budget });
    return response.data.data;
  },

  pausePromotion: async (id: string): Promise<Promotion> => {
    const response = await api.patch(`/promotions/${id}/pause`);
    return response.data.data;
  },

  resumePromotion: async (id: string): Promise<Promotion> => {
    const response = await api.patch(`/promotions/${id}/resume`);
    return response.data.data;
  },

  // Trend Promotions
  async createTrendPromotion(data: TrendPromotion): Promise<Promotion> {
    const response = await api.post('/promotions/trends', data);
    return response.data;
  },

  async getActiveTrendPromotions(): Promise<Promotion[]> {
    const response = await api.get('/promotions/trends/active');
    return response.data;
  },

  async stopTrendPromotion(promotionId: string): Promise<void> {
    await api.patch(`/promotions/trends/${promotionId}/stop`);
  },
};

export default promotionService;
