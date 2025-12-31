import api from './api';
import { mockCommunityService } from './mockCommunityService';

// Use mock service if API_URL is not set or in development
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false' || !process.env.NEXT_PUBLIC_API_URL;

export interface Community {
  _id: string;
  name: string;
  description: string;
  category: string;
  coverImage?: string;
  isPrivate: boolean;
  createdBy: {
    _id: string;
    username: string;
    avatar?: string;
  };
  memberCount: number;
  members: string[];
  moderators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityData {
  name: string;
  description: string;
  category: string;
  isPrivate?: boolean;
  coverImage?: File;
}

export interface UpdateCommunityData {
  name?: string;
  description?: string;
  category?: string;
  isPrivate?: boolean;
  coverImage?: File;
}

const realCommunityService = {
  // Get all communities
  getCommunities: async (page = 1, limit = 10): Promise<{ communities: Community[]; hasMore: boolean }> => {
    const response = await api.get(`/communities?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get community by ID
  getCommunity: async (communityId: string): Promise<Community> => {
    const response = await api.get(`/communities/${communityId}`);
    return response.data.data;
  },

  // Get user's communities
  getUserCommunities: async (userId: string): Promise<Community[]> => {
    const response = await api.get(`/communities/user/${userId}`);
    return response.data.data;
  },

  // Create community
  createCommunity: async (data: CreateCommunityData): Promise<Community> => {
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    
    if (data.isPrivate !== undefined) formData.append('isPrivate', String(data.isPrivate));
    if (data.coverImage) formData.append('coverImage', data.coverImage);

    const response = await api.post('/communities', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  // Update community
  updateCommunity: async (communityId: string, data: UpdateCommunityData): Promise<Community> => {
    const formData = new FormData();
    
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.isPrivate !== undefined) formData.append('isPrivate', String(data.isPrivate));
    if (data.coverImage) formData.append('coverImage', data.coverImage);

    const response = await api.put(`/communities/${communityId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  // Delete community
  deleteCommunity: async (communityId: string): Promise<void> => {
    await api.delete(`/communities/${communityId}`);
  },

  // Join community
  joinCommunity: async (communityId: string): Promise<Community> => {
    const response = await api.post(`/communities/${communityId}/join`);
    return response.data.data;
  },

  // Leave community
  leaveCommunity: async (communityId: string): Promise<Community> => {
    const response = await api.delete(`/communities/${communityId}/leave`);
    return response.data.data;
  },

  // Get community members
  getMembers: async (communityId: string): Promise<any[]> => {
    const response = await api.get(`/communities/${communityId}/members`);
    return response.data.data;
  },

  // Add moderator
  addModerator: async (communityId: string, userId: string): Promise<Community> => {
    const response = await api.post(`/communities/${communityId}/moderators`, { userId });
    return response.data.data;
  },

  // Remove moderator
  removeModerator: async (communityId: string, userId: string): Promise<Community> => {
    const response = await api.delete(`/communities/${communityId}/moderators/${userId}`);
    return response.data.data;
  },

  // Search communities
  searchCommunities: async (query: string): Promise<Community[]> => {
    const response = await api.get(`/communities/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Get communities by category
  getByCategory: async (category: string): Promise<Community[]> => {
    try {
      const response = await api.get(`/communities/category/${category}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load communities');
    }
  },
};

// Export the appropriate service
const communityService = USE_MOCK ? mockCommunityService : realCommunityService;

export default communityService;
