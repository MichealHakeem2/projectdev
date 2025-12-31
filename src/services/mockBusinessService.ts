import { Business } from './businessService';

const MOCK_BUSINESSES_KEY = 'mockBusinesses';

const generateMockBusiness = (data: Partial<Business>): Business => {
  const id = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    _id: id,
    userId: data.userId || 'user_1',
    name: data.name || 'Business Name',
    description: data.description || 'Business description',
    category: data.category || 'Technology',
    logo: data.logo,
    coverImage: data.coverImage,
    website: data.website,
    email: data.email,
    phone: data.phone,
    address: data.address,
    socialLinks: data.socialLinks,
    verified: data.verified || false,
    reputationScore: data.reputationScore || 0,
    followers: data.followers || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const getMockBusinesses = (): Business[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MOCK_BUSINESSES_KEY);
  if (!stored) {
    // Initialize with sample businesses
    const sampleBusinesses: Business[] = [
      generateMockBusiness({
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider specializing in AI and cloud computing.',
        category: 'Technology',
        verified: true,
        reputationScore: 92,
        followers: ['user_1', 'user_2'],
        address: { city: 'San Francisco', country: 'USA' },
      }),
      generateMockBusiness({
        name: 'Green Energy Co',
        description: 'Sustainable energy solutions for a better tomorrow.',
        category: 'Services',
        verified: true,
        reputationScore: 88,
        followers: ['user_1'],
        address: { city: 'New York', country: 'USA' },
      }),
      generateMockBusiness({
        name: 'Digital Marketing Pro',
        description: 'Full-service digital marketing agency helping businesses grow online.',
        category: 'Services',
        verified: false,
        reputationScore: 75,
        followers: [],
        address: { city: 'Los Angeles', country: 'USA' },
      }),
    ];
    localStorage.setItem(MOCK_BUSINESSES_KEY, JSON.stringify(sampleBusinesses));
    return sampleBusinesses;
  }
  return JSON.parse(stored);
};

const saveMockBusinesses = (businesses: Business[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_BUSINESSES_KEY, JSON.stringify(businesses));
  }
};

export const mockBusinessService = {
  getBusiness: async (businessId: string): Promise<Business> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const businesses = getMockBusinesses();
    const business = businesses.find(b => b._id === businessId);
    if (!business) throw new Error('Business not found');
    return business;
  },

  getUserBusinesses: async (userId: string): Promise<Business[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const businesses = getMockBusinesses();
    return businesses.filter(b => b.userId === userId);
  },

  createBusiness: async (data: any): Promise<Business> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const businesses = getMockBusinesses();

    const logo = data.logo instanceof File 
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.logo);
        })
      : data.logo;

    const coverImage = data.coverImage instanceof File
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.coverImage);
        })
      : data.coverImage;
    
    const newBusiness = generateMockBusiness({
      ...data,
      logo,
      coverImage,
      userId: currentUser.id || currentUser._id,
      verified: false,
      reputationScore: 0,
      followers: [],
    });

    businesses.push(newBusiness);
    saveMockBusinesses(businesses);
    return newBusiness;
  },

  updateBusiness: async (businessId: string, data: any): Promise<Business> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const businesses = getMockBusinesses();
    const index = businesses.findIndex(b => b._id === businessId);
    
    if (index === -1) throw new Error('Business not found');

    const logo = data.logo instanceof File 
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.logo);
        })
      : data.logo;

    const coverImage = data.coverImage instanceof File
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.coverImage);
        })
      : data.coverImage;
    
    businesses[index] = {
      ...businesses[index],
      ...data,
      logo: logo || businesses[index].logo,
      coverImage: coverImage || businesses[index].coverImage,
      updatedAt: new Date().toISOString(),
    };
    
    saveMockBusinesses(businesses);
    return businesses[index];
  },

  deleteBusiness: async (businessId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const businesses = getMockBusinesses();
    const filtered = businesses.filter(b => b._id !== businessId);
    saveMockBusinesses(filtered);
  },

  followBusiness: async (businessId: string): Promise<Business> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser._id;
    const businesses = getMockBusinesses();
    const business = businesses.find(b => b._id === businessId);
    
    if (!business) throw new Error('Business not found');
    if (userId && !business.followers.includes(userId)) {
      business.followers.push(userId);
    }
    
    saveMockBusinesses(businesses);
    return business;
  },

  unfollowBusiness: async (businessId: string): Promise<Business> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser._id;
    const businesses = getMockBusinesses();
    const business = businesses.find(b => b._id === businessId);
    
    if (!business) throw new Error('Business not found');
    if (userId) {
      business.followers = business.followers.filter(id => id !== userId);
    }
    
    saveMockBusinesses(businesses);
    return business;
  },

  getAnalytics: async (businessId: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      views: Math.floor(Math.random() * 10000),
      engagement: (Math.random() * 20).toFixed(1),
      followers: 0,
      growthRate: (Math.random() * 10).toFixed(1),
    };
  },

  searchBusinesses: async (query: string, category?: string): Promise<Business[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const businesses = getMockBusinesses();
    const queryLower = query.toLowerCase();
    let filtered = businesses.filter(b => 
      b.name.toLowerCase().includes(queryLower) ||
      b.description.toLowerCase().includes(queryLower)
    );
    
    if (category && category !== 'All') {
      filtered = filtered.filter(b => b.category === category);
    }
    
    return filtered;
  },

  getByCategory: async (category: string): Promise<{ businesses: Business[]; hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const businesses = getMockBusinesses();
    const filtered = category === 'All' 
      ? businesses 
      : businesses.filter(b => b.category === category);
    
    return { businesses: filtered, hasMore: false };
  },
};



