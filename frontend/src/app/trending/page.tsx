"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, Flame, Star, Zap, Globe, Cpu, Briefcase, Landmark, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '@/components/post/PostCard';
import postService, { Post } from '@/services/postService';
import trendService, { Hashtag, getTrendingPosts } from '@/services/trendService';
import promotionService, { getPromotions } from '@/services/promotionService';
import Card from '@/components/common/Card';
import Spinner from '@/components/common/Spinner';
import Badge from '@/components/common/Badge';
import TrendChart, { TrendDataPoint } from '@/components/trend/TrendChart';

export default function HashtagPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState<{ name: string; hashtagId: string } | undefined>(undefined);
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);

  const categories = [
    { name: 'All', icon: <Globe className="w-4 h-4" /> },
    { name: 'Technology', icon: <Cpu className="w-4 h-4" /> },
    { name: 'Business', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Finance', icon: <Landmark className="w-4 h-4" /> },
    { name: 'Design', icon: <Palette className="w-4 h-4" /> },
  ];
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        // 1️⃣ Fetch trending posts
        const trendingData = await trendService.getTrendingPosts(
          1, 10, selectedCategory, selectedTag?.name
        );

        // 2️⃣ Fetch promoted posts
        const promotions = await promotionService.getPromotions();
        const promotedPosts = promotions.map(p => ({
          _id: p._id,
          postId: p.postId,
          content: p.content || '', // optional
          isPromoted: true,
          createdAt: p.startDate || new Date().toISOString(), // ⚡ must be a valid ISO string
          author: { name: 'Sponsored', avatarUrl: '' },     // minimal required fields
          likes: 0,
          comments: 0,
          upvotes: 0,
          downvotes: 0
        }));


        // 3️⃣ Combine: promoted posts first
        const combinedPosts = [...promotedPosts, ...trendingData.posts];

        setPosts(combinedPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [selectedTag, selectedCategory]);

  useEffect(() => {
    // Mock chart data
    const mockData: TrendDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
      timestamp: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 500) + 200 + (i * 20)
    }));
    setChartData(mockData);
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        // Fetch hashtags
        const tags: Hashtag[] = await trendService.getHashtags(20);
        setHashtags(tags);

        // Optional: fetch posts for selected tag
        if (selectedTag) {
          const feedData = await trendService.getPostsByHashtag(selectedTag.name, 1, 10);
          setPosts(feedData.posts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Failed to load hashtags/posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [selectedTag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header & Chart Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 relative p-8 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary-600 to-indigo-900 shadow-2xl shadow-primary-500/20 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <Badge className="mb-4 bg-white/20 backdrop-blur-md text-white border-none py-1.5 px-4 rounded-full font-black uppercase tracking-widest text-[10px]">
              Live Pulse Analytics
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
              Popular Trending <span className="text-primary-300">Today</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl font-medium leading-relaxed">
              Discover the most talked-about hashtags in the network right now.
            </p>
          </div>
        </div>
        <div className="xl:col-span-1">
          <TrendChart
            data={chartData}
            title="Network Activity"
            color="#6366F1"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap border-2 ${selectedCategory === cat.name
              ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/30'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-900/40'
              }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content - Trending & Promoted Posts */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {selectedTag ? `Posts for #${selectedTag.name}` : "Trending & Promoted Posts"}
            </h2>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(undefined)}
                className="text-xs font-black uppercase text-primary-500 hover:text-primary-600"
              >
                Clear Filter
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-6"
              >
                <Spinner size="lg" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
                  Fetching Network Pulse...
                </p>
              </motion.div>
            ) : posts.length > 0 ? (
              <motion.div
                key={selectedTag?.hashtagId || 'trending'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    isPromoted={post.isPromoted} // optional: mark promoted posts visually
                  />
                ))}
              </motion.div>
            ) : (
              <Card className="p-20 text-center border-none shadow-xl bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No posts found</h3>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">
                  {selectedTag
                    ? `No posts available under #${selectedTag.name}.`
                    : "No trending or promoted posts found right now."}
                </p>
              </Card>
            )}
          </AnimatePresence>
        </div>



        {/* Sidebar - Hashtags */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
          <Card className="p-8 sticky top-24 border-none shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl rounded-[2rem]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-yellow-500 rounded-xl text-white shadow-lg shadow-yellow-500/20">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Hot Hashtags</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Most Used</p>
              </div>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <div className="py-10 flex justify-center"><Spinner size="sm" /></div>
                ) : hashtags.map((tag, index) => (
                  <motion.div
                    key={tag._id || `tag-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedTag({ name: tag.name, hashtagId: tag._id })}
                    className={`flex items-center justify-between group cursor-pointer p-3 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900 dark:text-gray-100">#{tag.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500">
                      {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}K` : tag.count}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
