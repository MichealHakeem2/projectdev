"use client";

import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostActionsProps {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export default function PostActions({
  postId,
  likes,
  comments,
  shares,
  isLiked = false,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: PostActionsProps) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        {/* Like Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            isLiked
              ? 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Heart
            className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
          />
          <span className="text-sm font-semibold">{likes}</span>
        </motion.button>

        {/* Comment Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComment}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{comments}</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{shares}</span>
        </motion.button>
      </div>

      {/* Bookmark Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBookmark}
        className={`p-2 rounded-full transition-all ${
          isBookmarked
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
      </motion.button>
    </div>
  );
}
