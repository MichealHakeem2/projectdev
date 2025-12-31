import { Post, CreatePostData, UpdatePostData } from './postService';

// Mock post service that uses localStorage
const MOCK_POSTS_KEY = 'mockPosts';

const generateMockPost = (data: Partial<Post>): Post => {
  const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    _id: id,
    author: {
      _id: data.author?._id || 'user_1',
      username: data.author?.username || 'John Doe',
      avatar: data.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.author?.username || 'User')}&background=3B82F6&color=fff`,
    },
    content: data.content || '',
    media: data.media || [],
    category: data.category || 'General',
    hashtags: data.hashtags || [],
    mentions: data.mentions || [],
    likes: data.likes || [],
    upvotes: data.upvotes || [],
    downvotes: data.downvotes || [],
    commentCount: data.commentCount || 0,
    shareCount: data.shareCount || 0,
    isPromoted: data.isPromoted || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const getMockPosts = (): Post[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MOCK_POSTS_KEY);
  if (!stored) {
    // Initialize with sample posts
    const samplePosts: Post[] = [
      generateMockPost({
        content: 'Excited to announce our new product launch! 🚀 This is going to revolutionize the industry.',
        author: { _id: 'user_1', username: 'TechCorp', avatar: 'https://ui-avatars.com/api/?name=TechCorp&background=3B82F6&color=fff' },
        category: 'Technology',
        hashtags: ['#innovation', '#tech', '#startup'],
        likes: ['user_2', 'user_3'],
        commentCount: 5,
        shareCount: 12,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
      generateMockPost({
        content: 'Just finished an amazing networking event! Met so many inspiring entrepreneurs. 💼',
        author: { _id: 'user_2', username: 'Sarah Johnson', avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=A855F7&color=fff' },
        category: 'Business',
        hashtags: ['#networking', '#entrepreneurship'],
        likes: ['user_1', 'user_3'],
        commentCount: 3,
        shareCount: 8,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      }),
      generateMockPost({
        content: 'The future of AI in business is here! Check out our latest insights on how AI is transforming industries.',
        author: { _id: 'user_3', username: 'AI Insights', avatar: 'https://ui-avatars.com/api/?name=AI+Insights&background=06B6D4&color=fff' },
        category: 'Technology',
        hashtags: ['#AI', '#machinelearning', '#business'],
        likes: ['user_1', 'user_2'],
        commentCount: 8,
        shareCount: 15,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(samplePosts));
    return samplePosts;
  }
  return JSON.parse(stored);
};

const saveMockPosts = (posts: Post[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
  }
};

export const mockPostService = {
  getFeed: async (page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const allPosts = getMockPosts();
    const start = (page - 1) * limit;
    const end = start + limit;
    const posts = allPosts.slice(start, end);
    return { posts, hasMore: end < allPosts.length };
  },

  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allPosts = getMockPosts();
    const userPosts = allPosts.filter(p => p.author._id === userId);
    const start = (page - 1) * limit;
    const end = start + limit;
    const posts = userPosts.slice(start, end);
    return { posts, hasMore: end < userPosts.length };
  },

  getBusinessPosts: async (businessId: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allPosts = getMockPosts();
    const businessPosts = allPosts.filter(p => p.business?._id === businessId);
    const start = (page - 1) * limit;
    const end = start + limit;
    const posts = businessPosts.slice(start, end);
    return { posts, hasMore: end < businessPosts.length };
  },

  getPost: async (postId: string): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const posts = getMockPosts();
    const post = posts.find(p => p._id === postId);
    if (!post) throw new Error('Post not found');
    return post;
  },

  createPost: async (data: CreatePostData): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const posts = getMockPosts();
    
    // Process media files into mock URLs (Base64 for persistence in mock mode)
    const media: { type: 'image' | 'video'; url: string }[] = await Promise.all(
      (data.media || []).map(async (file) => {
        const type = file.type.startsWith('video/') ? 'video' as const : 'image' as const;
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        return { type, url: base64 };
      })
    );

    const newPost = generateMockPost({
      content: data.content,
      category: data.category,
      hashtags: data.hashtags,
      media,
      author: {
        _id: currentUser.id || currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      likes: [],
      commentCount: 0,
      shareCount: 0,
    });

    posts.unshift(newPost);
    saveMockPosts(posts);
    return newPost;
  },

  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const posts = getMockPosts();
    const index = posts.findIndex(p => p._id === postId);
    if (index === -1) throw new Error('Post not found');
    
    posts[index] = {
      ...posts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    saveMockPosts(posts);
    return posts[index];
  },

  deletePost: async (postId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const posts = getMockPosts();
    const filtered = posts.filter(p => p._id !== postId);
    saveMockPosts(filtered);
  },

  likePost: async (postId: string): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser._id;
    const posts = getMockPosts();
    const post = posts.find(p => p._id === postId);
    
    if (!post) throw new Error('Post not found');
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    }
    
    saveMockPosts(posts);
    return post;
  },

  unlikePost: async (postId: string): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser._id;
    const posts = getMockPosts();
    const post = posts.find(p => p._id === postId);
    
    if (!post) throw new Error('Post not found');
    post.likes = post.likes.filter(id => id !== userId);
    
    saveMockPosts(posts);
    return post;
  },

  sharePost: async (postId: string): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const posts = getMockPosts();
    const post = posts.find(p => p._id === postId);
    
    if (!post) throw new Error('Post not found');
    post.shareCount = (post.shareCount || 0) + 1;
    
    saveMockPosts(posts);
    return post;
  },

  searchPosts: async (query: string, page = 1, limit = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const allPosts = getMockPosts();
    const queryLower = query.toLowerCase();
    const filtered = allPosts.filter(p => 
      p.content.toLowerCase().includes(queryLower) ||
      p.hashtags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
    const start = (page - 1) * limit;
    const end = start + limit;
    const posts = filtered.slice(start, end);
    return { posts, hasMore: end < filtered.length };
  },

  votePost: async (postId: string, type: 'up' | 'down'): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser._id;
    const posts = getMockPosts();
    const post = posts.find(p => p._id === postId);
    
    if (!post) throw new Error('Post not found');
    
    // Initialize if missing (for legacy mocks)
    post.upvotes = post.upvotes || [];
    post.downvotes = post.downvotes || [];

    if (type === 'up') {
      if (post.upvotes.includes(userId)) {
        post.upvotes = post.upvotes.filter(id => id !== userId);
      } else {
        post.upvotes.push(userId);
        post.downvotes = post.downvotes.filter(id => id !== userId);
      }
    } else {
      if (post.downvotes.includes(userId)) {
        post.downvotes = post.downvotes.filter(id => id !== userId);
      } else {
        post.downvotes.push(userId);
        post.upvotes = post.upvotes.filter(id => id !== userId);
      }
    }
    
    saveMockPosts(posts);
    return post;
  },
};



