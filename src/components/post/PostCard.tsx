"use client";

import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import postService, { Post } from '@/services/postService';
import { formatTimeAgo } from '@/utils/dateHelpers';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import CommentList from '../comment/CommentList';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onDelete }) => {
  const { user } = useAuth();
  const userId = user?._id || '';
  
  const [upvotes, setUpvotes] = useState(post.upvotes || []);
  const [downvotes, setDownvotes] = useState(post.downvotes || []);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [showComments, setShowComments] = useState(false);

  const userVote = upvotes.includes(userId) ? 'up' : downvotes.includes(userId) ? 'down' : null;
  const score = upvotes.length - downvotes.length;

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) return;
    try {
      const updatedPost = await postService.votePost(post._id, type);
      setUpvotes(updatedPost.upvotes || []);
      setDownvotes(updatedPost.downvotes || []);
      if (type === 'up' && onLike) {
        onLike(post._id);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleShare = async () => {
    try {
      const updatedPost = await postService.sharePost(post._id);
      setShareCount(updatedPost.shareCount);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const isOwner = userId === post.author?._id;

  const dropdownItems = [
    ...(isOwner
      ? [
          {
            label: 'Edit Post',
            onClick: () => console.log('Edit post'),
            icon: <Edit className="w-4 h-4" />,
          },
          {
            label: 'Delete Post',
            onClick: () => onDelete?.(post._id),
            icon: <Trash2 className="w-4 h-4" />,
            danger: true,
          },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect dark:bg-gray-900/50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-white/20 dark:border-gray-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.author?.avatar} alt={post.author?.username || 'User'} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{post.author?.username || 'Anonymous'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isOwner && dropdownItems.length > 0 && (
          <Dropdown
            trigger={
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            }
            items={dropdownItems}
          />
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`mb-4 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media.map((item, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
              {item.type === 'video' ? (
                <video 
                  src={item.url} 
                  controls 
                  playsInline
                  className="w-full max-h-[400px] object-contain bg-black"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Post media ${index + 1}`}
                  className="w-full max-h-[500px] object-contain"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 rounded-full p-1 border border-gray-100 dark:border-gray-800">
          <button
            onClick={() => handleVote('up')}
            className={`p-1.5 rounded-full transition-all ${
              userVote === 'up' 
                ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                : 'text-gray-500 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowBigUp className={`w-6 h-6 ${userVote === 'up' ? 'fill-current' : ''}`} />
          </button>
          <span className={`text-sm font-bold px-1 min-w-[2ch] text-center ${
            userVote === 'up' ? 'text-orange-500' : userVote === 'down' ? 'text-indigo-500' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {score}
          </span>
          <button
            onClick={() => handleVote('down')}
            className={`p-1.5 rounded-full transition-all ${
              userVote === 'down' 
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'text-gray-500 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowBigDown className={`w-6 h-6 ${userVote === 'down' ? 'fill-current' : ''}`} />
          </button>
        </div>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            showComments 
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{post.commentCount || 0}</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-full transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{shareCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <CommentList postId={post._id} />
        </div>
      )}
    </motion.div>
  );
};

export default PostCard;
