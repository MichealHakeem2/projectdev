import api from './api';
import postService, { Post } from './postService';

export interface TrendingTopic {
  name: string;
  count: number;
  isPromoted?: boolean;
  promotionLabel?: string;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false' || !process.env.NEXT_PUBLIC_API_URL;

const mockTrends: TrendingTopic[] = [
  { name: 'BusinessNet Platinum', count: 520, isPromoted: true, promotionLabel: 'Featured' },
  { name: 'Networking', count: 124 },
  { name: 'Startups', count: 89 },
  { name: 'Innovation', count: 56 },
  { name: 'Business', count: 45 },
  { name: 'AI', count: 32 },
];

const trendService = {
  getTrendingTopics: async (): Promise<TrendingTopic[]> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTrends;
    }
    const response = await api.get('/trends/topics');
    return response.data.data;
  },

  getTrendingPosts: async (page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    if (USE_MOCK) {
       // Using regular feed for mock trending posts but could be filtered by likes
       return postService.getFeed(page, limit);
    }
    const response = await api.get(`/trends/posts?page=${page}&limit=${limit}`);
    return response.data.data;
  },
};

export default trendService;
