import api from './api';
import { mockPostService } from './mockPostService';

// Use mock service if API_URL is not set or in development
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false' || !process.env.NEXT_PUBLIC_API_URL;

export interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  business?: {
    _id: string;
    name: string;
    logo?: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  category?: string;
  hashtags?: string[];
  mentions?: string[];
  likes: string[];
  upvotes: string[];
  downvotes: string[];
  commentCount: number;
  shareCount: number;
  isPromoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  media?: File[];
  category?: string;
  hashtags?: string[];
  mentions?: string[];
  businessId?: string;
}

export interface UpdatePostData {
  content?: string;
  category?: string;
  hashtags?: string[];
}

const realPostService = {
  // Get feed posts
  getFeed: async (page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get posts by user
  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const response = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get posts by business
  getBusinessPosts: async (businessId: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const response = await api.get(`/posts/business/${businessId}?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get single post
  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data.data;
  },

  // Create a new post
  createPost: async (data: CreatePostData): Promise<Post> => {
    const formData = new FormData();
    
    formData.append('content', data.content);
    
    if (data.category) formData.append('category', data.category);
    if (data.businessId) formData.append('businessId', data.businessId);
    if (data.hashtags) formData.append('hashtags', JSON.stringify(data.hashtags));
    if (data.mentions) formData.append('mentions', JSON.stringify(data.mentions));
    
    if (data.media) {
      data.media.forEach((file) => {
        formData.append('media', file);
      });
    }

    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  // Update a post
  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data.data;
  },

  // Delete a post
  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  // Like a post
  likePost: async (postId: string): Promise<Post> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data.data;
  },

  // Unlike a post
  unlikePost: async (postId: string): Promise<Post> => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data.data;
  },

  // Share a post
  sharePost: async (postId: string): Promise<Post> => {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data.data;
  },

  // Search posts
  searchPosts: async (query: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Vote on a post
  votePost: async (postId: string, type: 'up' | 'down'): Promise<Post> => {
    const response = await api.post(`/posts/${postId}/vote`, { type });
    return response.data.data;
  },
};

// Export the appropriate service
const postService = USE_MOCK ? mockPostService : realPostService;

export default postService;
