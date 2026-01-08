"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCreate from '@/components/post/PostCreate';
import PostList from '@/components/post/PostList';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import postService from '@/services/postService';
import TrendingTopics from '@/components/trend/TrendingTopics';
import SuggestedBusiness from '@/components/business/SuggestedBusiness';
import ConnectionSuggestions from '@/components/profile/ConnectionSuggestions';

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [selectedTrend, setSelectedTrend] = React.useState<{ name: string; hashtagId: string } | undefined>(undefined);
  const { posts, isLoading, loadFeed } = useFeed(selectedTrend?.name, selectedTrend?.hashtagId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Removed redundant useEffect that called loadFeed(true). useFeed hook handles initial load.

  const handleCreatePost = async (content: string, media?: File[], category?: string) => {
    if (!user) return;
    try {
      const businessId = user.businessId || (user.accountType === 'business' ? user._id : undefined);
      await postService.createPost({ content, media, businessId, category });
      // Reload feed to show the new post
      await loadFeed(true);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await postService.likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Trending & Business */}
        <div className="hidden lg:block space-y-3 lg:col-span-1">
          <TrendingTopics
            onSelectTag={(trend) => setSelectedTrend(trend.hashtagId === selectedTrend?.hashtagId ? undefined : trend)}
            selectedTag={selectedTrend?.name}
          />
          <SuggestedBusiness />
        </div>

        {/* Main Feed */}
        <main className="lg:col-span-2 space-y-6">
          {selectedTrend && (
            <div className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-800/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">Filtering by: #{selectedTrend.name}</span>
              </div>
              <button
                onClick={() => setSelectedTrend(undefined)}
                className="text-xs font-black uppercase text-primary-500 hover:text-primary-600"
              >
                Clear Filter
              </button>
            </div>
          )}
          <PostCreate onSubmit={handleCreatePost} />
          <PostList
            posts={posts}
            isLoading={isLoading}
            onLike={handleLikePost}
            onDelete={handleDeletePost}
          />
        </main>
      </div>
    </div>
  );
}
