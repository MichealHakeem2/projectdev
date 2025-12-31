import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'business';
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    accountType: string;
    avatar?: string;
    fullName?: string;
  };
}

// Mock mode - set to false when backend is ready
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false';

// Mock auth service for development
const mockAuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const user = users.find((u: any) => u.email === credentials.email && u.password === credentials.password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const authResponse: AuthResponse = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        accountType: user.role,
        avatar: user.avatar,
        fullName: user.fullName,
      },
    };

    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
    return authResponse;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if email or username already exists
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    if (users.some((u: any) => u.email === data.email)) {
      throw new Error('Email already registered');
    }
    if (users.some((u: any) => u.username === data.username)) {
      throw new Error('Username already taken');
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: data.username,
      email: data.email,
      password: data.password, // In real app, this would be hashed
      role: data.role,
      fullName: data.fullName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=3B82F6&color=fff`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('mockUsers', JSON.stringify(users));

    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const authResponse: AuthResponse = {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        accountType: newUser.role,
        avatar: newUser.avatar,
        fullName: newUser.fullName,
      },
    };

    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
    return authResponse;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }

    // Fallback: get from mock users
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const userId = token.split('_')[2]; // Extract user ID from mock token
    const user = users.find((u: any) => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.role,
      avatar: user.avatar,
      fullName: user.fullName,
    };
  },
};

// Real API service
const realAuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      const authData = response.data.data || response.data;
      if (authData && authData.token) {
        localStorage.setItem('token', authData.token);
        if (authData.user) {
          localStorage.setItem('currentUser', JSON.stringify(authData.user));
        }
      }
      return authData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed';
      throw new Error(errorMessage);
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', data);
      const authData = response.data.data || response.data;
      if (authData && authData.token) {
        localStorage.setItem('token', authData.token);
        if (authData.user) {
          localStorage.setItem('currentUser', JSON.stringify(authData.user));
        }
      }
      return authData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Registration failed';
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data.data || response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to get user';
      throw new Error(errorMessage);
    }
  },
};

// Export the appropriate service based on environment
export const authService = USE_MOCK_AUTH ? mockAuthService : realAuthService;
