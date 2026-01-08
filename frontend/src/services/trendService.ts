import api from "./api";
import { Post } from './postService';

export interface Hashtag {
  _id: string;
  name: string;
  count: number;
}

export interface TrendingTopic {
  _id: string;
  name: string;
  count: number;
  growth: number;
  isPromoted: boolean;
  promotionLabel?: string;
  category: string;
  hashtagId?: string; // changed from keywordId
  postId?: string;
}

const trendService = {
  // Get trending topics (mixed organic + promoted)
  getTrendingTopics: async (category?: string): Promise<TrendingTopic[]> => {
    const response = await api.get(`/trends/topics${category ? `?category=${category}` : ''}`);
    return response.data.data;
  },

  // Get trending posts for the feed
  getTrendingPosts: async (page = 1, limit = 10, category?: string, hashtag?: string): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const response = await api.get(`/trends/posts?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}${hashtag ? `&hashtag=${encodeURIComponent(hashtag)}` : ''}`);
    return response.data.data;
  },

getHashtags: async (limit = 10, hashtag?: string): Promise<Hashtag[]> => {
  const response = await api.get('/trends/hashtags', {
    params: { limit, hashtag }
  });
  return response.data.data;
},


  // Fetch posts by specific hashtag
  getPostsByHashtag: async (
    hashtag: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await api.get(`/trends/posts/${encodeURIComponent(hashtag)}`, {
      params: { page, limit },
    });
    return response.data.data;
  },
};

export default trendService;
