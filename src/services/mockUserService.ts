import { User, UpdateProfileData } from "./userService";

const MOCK_USERS_KEY = "mockUsers";

const getMockUsers = (): any[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const generateMockUser = (data: Partial<User>): User => {
  return {
    _id: data._id || `user_${Date.now()}`,
    username: data.username || "User",
    email: data.email || "user@example.com",
    avatar: data.avatar,
    bio: data.bio,
    location: data.location,
    website: data.website,
    accountType: data.accountType || "user",
    followers: data.followers || [],
    following: data.following || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

export const mockUserService = {
  getProfile: async (userId: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = getMockUsers();
    const user = users.find((u: any) => u.id === userId || u._id === userId);
    
    if (user) {
      return generateMockUser({
        _id: user.id || user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        accountType: user.role || "user",
        followers: [],
        following: [],
      });
    }
    
    // Return current user if not found
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (currentUser.id === userId || currentUser._id === userId) {
      return generateMockUser({
        _id: currentUser.id || currentUser._id,
        username: currentUser.username,
        email: currentUser.email,
        avatar: currentUser.avatar,
        accountType: currentUser.accountType || "user",
        followers: [],
        following: [],
      });
    }
    
    throw new Error("User not found");
  },

  getCurrentUser: async (): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return generateMockUser({
      _id: currentUser.id || currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
      avatar: currentUser.avatar,
      accountType: currentUser.accountType || "user",
      followers: [],
      following: [],
    });
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    
    let avatarBase64 = currentUser.avatar;
    if (data.avatar instanceof File) {
      const reader = new FileReader();
      avatarBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(data.avatar!);
      });
    }

    const updated = {
      ...currentUser,
      ...data,
      avatar: avatarBase64,
    };
    localStorage.setItem("currentUser", JSON.stringify(updated));
    return generateMockUser(updated);
  },

  followUser: async (userId: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Mock implementation - would update in real service
    return generateMockUser({ _id: userId });
  },

  unfollowUser: async (userId: string): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Mock implementation
    return generateMockUser({ _id: userId });
  },

  getFollowers: async (userId: string): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [];
  },

  getFollowing: async (userId: string): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [];
  },

  searchUsers: async (query: string): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const users = getMockUsers();
    const queryLower = query.toLowerCase();
    return users
      .filter(
        (u: any) =>
          u.username?.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower)
      )
      .map((u: any) =>
        generateMockUser({
          _id: u.id || u._id,
          username: u.username,
          email: u.email,
          avatar: u.avatar,
          accountType: u.role || "user",
        })
      );
  },
};



