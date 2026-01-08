"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import trendService, { Hashtag } from '@/services/trendService';
import categoryService from '@/services/categoryService';
import Card from '../common/Card';
import Spinner from '../common/Spinner';

interface HashtagListProps {
  onSelectTag?: (tag: { name: string; hashtagId: string }) => void;
  selectedTag?: string;
}

export default function HashtagList({ onSelectTag, selectedTag }: HashtagListProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(['All', ...cats.map(c => c.name)]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch hashtags when category changes
  useEffect(() => {
    const loadHashtags = async () => {
      setIsLoading(true);
      try {
        const tags: Hashtag[] = await trendService.getHashtags(20); // adjust limit
        setHashtags(tags);
      } catch (error) {
        console.error('Failed to load hashtags:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHashtags();
  }, [selectedCategory]);

  return (
    <Card className="p-5 overflow-hidden border-none shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-black text-gray-900 dark:text-gray-100 tracking-tight">Popular Hashtags</h2>
        <button
          onClick={() => window.location.href = '/trending'}
          className="text-xs font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hashtags List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="sm" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">
            Loading Hashtags...
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {hashtags.map((tag, index) => (
              <motion.div
                key={tag._id || `tag-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
                className="flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  if (onSelectTag) {
                    onSelectTag({ name: tag.name, hashtagId: tag._id });
                  } else {
                    window.location.href = `/search?q=${encodeURIComponent('#' + tag.name)}`;
                  }
                }}
              >
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  #{tag.name}
                </span>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tabular-nums">
                  {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}K` : tag.count}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
