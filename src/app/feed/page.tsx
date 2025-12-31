"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCreate from '@/components/post/PostCreate';
import PostList from '@/components/post/PostList';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import postService from '@/services/postService';
import { mockPostService } from '@/services/mockPostService';
import { usePostStore } from '@/store/postStore';
import TrendingTopics from '@/components/trend/TrendingTopics';
import SuggestedBusiness from '@/components/business/SuggestedBusiness';
import ConnectionSuggestions from '@/components/profile/ConnectionSuggestions';

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { posts, isLoading, loadFeed } = useFeed();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFeed(true);
    }
  }, [isAuthenticated, loadFeed]);

  const handleCreatePost = async (content: string, media?: File[]) => {
    if (!user) return;
    try {
      const newPost = await postService.createPost({ content, media });
      // Add post to store if not handled by socket (mock mode)
      if (postService === mockPostService) {
        usePostStore.getState().addPost(newPost);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />
      
      <div className="flex">
        <Sidebar aria-label="Main Sidebar" />
        
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Trending & Business */}
            <div className="hidden lg:block space-y-6 lg:col-span-3">
              <TrendingTopics />
              <SuggestedBusiness />
            </div>

            {/* Main Feed */}
            <main className="lg:col-span-6 space-y-6">
              <PostCreate onSubmit={handleCreatePost} />
              <PostList
                posts={posts}
                isLoading={isLoading}
                onLike={handleLikePost}
                onDelete={handleDeletePost}
              />
            </main>

            {/* Right Sidebar - Connections */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6">
              <ConnectionSuggestions />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
