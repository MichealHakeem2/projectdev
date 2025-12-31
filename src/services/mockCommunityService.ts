import { Community, CreateCommunityData } from "./communityService";

const MOCK_COMMUNITIES_KEY = "mockCommunities";

const generateMockCommunity = (data: Partial<Community>): Community => {
  const id = `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return {
    _id: id,
    name: data.name || "Community Name",
    description: data.description || "Community description",
    category: data.category || "General",
    coverImage: data.coverImage,
    isPrivate: data.isPrivate || false,
    createdBy: {
      _id: data.createdBy?._id || currentUser.id || currentUser._id || "user_1",
      username: data.createdBy?.username || currentUser.username || "Admin",
      avatar: data.createdBy?.avatar || currentUser.avatar,
    },
    memberCount: data.memberCount || 0,
    members: data.members || [],
    moderators: data.moderators || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const getMockCommunities = (): Community[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_COMMUNITIES_KEY);
  if (!stored) {
    // Initialize with sample communities
    const sampleCommunities: Community[] = [
      generateMockCommunity({
        name: "Tech Entrepreneurs",
        description: "A community for tech entrepreneurs to share ideas and network.",
        category: "Technology",
        isPrivate: false,
        memberCount: 1250,
        members: ["user_1", "user_2"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      generateMockCommunity({
        name: "Startup Founders",
        description: "Connect with fellow startup founders and share experiences.",
        category: "Business",
        isPrivate: false,
        memberCount: 850,
        members: ["user_1"],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      generateMockCommunity({
        name: "AI & Machine Learning",
        description: "Discuss the latest in AI and ML technologies.",
        category: "Technology",
        isPrivate: false,
        memberCount: 2100,
        members: [],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    localStorage.setItem(MOCK_COMMUNITIES_KEY, JSON.stringify(sampleCommunities));
    return sampleCommunities;
  }
  return JSON.parse(stored);
};

const saveMockCommunities = (communities: Community[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_COMMUNITIES_KEY, JSON.stringify(communities));
  }
};

export const mockCommunityService = {
  getCommunities: async (
    page = 1,
    limit = 10
  ): Promise<{ communities: Community[]; hasMore: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const allCommunities = getMockCommunities();
    const start = (page - 1) * limit;
    const end = start + limit;
    const communities = allCommunities.slice(start, end);
    return { communities, hasMore: end < allCommunities.length };
  },

  getCommunity: async (communityId: string): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    const community = communities.find((c) => c._id === communityId);
    if (!community) throw new Error("Community not found");
    return community;
  },

  getUserCommunities: async (userId: string): Promise<Community[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    return communities.filter((c) => c.members.includes(userId));
  },

  createCommunity: async (data: CreateCommunityData): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const communities = getMockCommunities();

    let coverImageBase64 = undefined;
    if (data.coverImage) {
      const reader = new FileReader();
      coverImageBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(data.coverImage!);
      });
    }

    const newCommunity = generateMockCommunity({
      ...data,
      coverImage: coverImageBase64,
      createdBy: {
        _id: currentUser.id || currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      memberCount: 1,
      members: [currentUser.id || currentUser._id],
    } as any);

    communities.push(newCommunity);
    saveMockCommunities(communities);
    return newCommunity;
  },

  updateCommunity: async (
    communityId: string,
    data: Partial<Community>
  ): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const communities = getMockCommunities();
    const index = communities.findIndex((c) => c._id === communityId);

    if (index === -1) throw new Error("Community not found");

    communities[index] = {
      ...communities[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveMockCommunities(communities);
    return communities[index];
  },

  deleteCommunity: async (communityId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    const filtered = communities.filter((c) => c._id !== communityId);
    saveMockCommunities(filtered);
  },

  joinCommunity: async (communityId: string): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const communities = getMockCommunities();
    const community = communities.find((c) => c._id === communityId);

    if (!community) throw new Error("Community not found");
    if (userId && !community.members.includes(userId)) {
      community.members.push(userId);
      community.memberCount = community.members.length;
    }

    saveMockCommunities(communities);
    return community;
  },

  leaveCommunity: async (communityId: string): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const communities = getMockCommunities();
    const community = communities.find((c) => c._id === communityId);

    if (!community) throw new Error("Community not found");
    if (userId) {
      community.members = community.members.filter((id) => id !== userId);
      community.memberCount = community.members.length;
    }

    saveMockCommunities(communities);
    return community;
  },

  getMembers: async (communityId: string): Promise<any[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const community = getMockCommunities().find((c) => c._id === communityId);
    if (!community) throw new Error("Community not found");
    // Return mock member data
    return community.members.map((id) => ({
      _id: id,
      username: `User ${id}`,
      avatar: `https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff`,
    }));
  },

  addModerator: async (communityId: string, userId: string): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    const community = communities.find((c) => c._id === communityId);

    if (!community) throw new Error("Community not found");
    if (!community.moderators.includes(userId)) {
      community.moderators.push(userId);
    }

    saveMockCommunities(communities);
    return community;
  },

  removeModerator: async (communityId: string, userId: string): Promise<Community> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    const community = communities.find((c) => c._id === communityId);

    if (!community) throw new Error("Community not found");
    community.moderators = community.moderators.filter((id) => id !== userId);

    saveMockCommunities(communities);
    return community;
  },

  searchCommunities: async (query: string): Promise<Community[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const communities = getMockCommunities();
    const queryLower = query.toLowerCase();
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower)
    );
  },

  getByCategory: async (category: string): Promise<Community[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const communities = getMockCommunities();
    return communities.filter((c) => c.category === category);
  },
};



