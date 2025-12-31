"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, Flame, Star, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import PostCard from '@/components/post/PostCard';
import { Post } from '@/services/postService';
import trendService, { TrendingTopic } from '@/services/trendService';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import Badge from '@/components/common/Badge';

export default function TrendingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        const [postsData, topicsData] = await Promise.all([
          trendService.getTrendingPosts(1, 10),
          trendService.getTrendingTopics()
        ]);
        setPosts(postsData.posts || []);
        setTopics(topicsData || []);
      } catch (error) {
        console.error('Failed to load trending content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrendingContent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar aria-label="Main Sidebar" />
        
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Trending Now</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Discover what's hot in the professional world</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - Trending Posts */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Viral Posts</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">No trending posts found yet.</p>
                </Card>
              )}
            </div>

            {/* Sidebar - Trending Topics */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Hot Hashtags</h2>
                </div>
                
                <div className="space-y-4">
                  {isLoading ? (
                    <Spinner size="sm" />
                  ) : topics.map((topic, index) => (
                    <div 
                      key={topic.name}
                      onClick={() => window.location.href = `/search?q=${encodeURIComponent('#' + topic.name)}`}
                      className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 group-hover:text-primary-500 transition-colors">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                          #{topic.name}
                        </span>
                      </div>
                      <Badge variant="gray" size="sm">
                        {topic.count} posts
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-primary-500" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Rising Stars</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Businesses with the highest reputation growth this week.</p>
                  <button 
                    onClick={() => window.location.href = '/business'}
                    className="w-full py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-primary-100 dark:border-primary-900/30"
                  >
                    View Top Businesses
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
