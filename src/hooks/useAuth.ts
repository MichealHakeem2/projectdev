import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setToken, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser({
            _id: userData._id || userData.id,
            id: userData.id || userData._id,
            username: userData.username,
            email: userData.email,
            accountType: userData.accountType || userData.role,
            avatar: userData.avatar,
          });
        } catch (error) {
          // If auth fails, clear everything
          logout();
        }
      } else {
        setUser(null);
      }
    };

    initAuth();
  }, [setUser, logout]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser({
        _id: response.user._id || response.user.id,
        id: response.user.id || response.user._id,
        username: response.user.username,
        email: response.user.email,
        accountType: response.user.accountType,
        avatar: response.user.avatar,
      });
      setToken(response.token);
      router.push('/feed');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    role: 'user' | 'business';
  }) => {
    try {
      const response = await authService.register(data);
      setUser({
        _id: response.user._id || response.user.id,
        id: response.user.id || response.user._id,
        username: response.user.username,
        email: response.user.email,
        accountType: response.user.accountType,
        avatar: response.user.avatar,
      });
      setToken(response.token);
      router.push('/feed');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
};
