"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import trendService, { TrendingTopic } from '@/services/trendService';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';

export default function TrendingTopics() {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const data = await trendService.getTrendingTopics();
        setTrends(data);
      } catch (error) {
        console.error('Failed to load trends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrends();
  }, []);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-gray-900 dark:text-gray-100">Trending Topics</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-3">
          {trends.map((tag) => (
            <motion.div
              key={tag.name}
              whileHover={{ x: 4 }}
              className={`flex flex-col gap-1 p-2 rounded-lg transition-all cursor-pointer ${
                tag.isPromoted 
                  ? 'bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => window.location.href = `/search?q=${encodeURIComponent('#' + tag.name)}`}
            >
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold transition-colors ${
                    tag.isPromoted 
                      ? 'text-primary-700 dark:text-primary-300' 
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-primary-600'
                  }`}>
                    #{tag.name}
                  </span>
                  {tag.isPromoted && (
                    <Badge variant="custom" className="bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] py-0 px-1.5 h-auto">
                      {tag.promotionLabel || 'Promoted'}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
                  {tag.count}
                </span>
              </div>
              {tag.isPromoted && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                  Promoted by BusinessNet
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
