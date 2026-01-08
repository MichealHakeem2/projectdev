"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSocket } from '@/hooks/useSocket';
import { Post } from '@/services/postService';
import Avatar from '../common/Avatar';
import PostActions from './PostActions';
import CommentList from '../comment/CommentList';
import { formatTimeAgo } from '@/utils/dateHelpers';
import Card from '../common/Card';
import Button from '../common/Button';

interface PostDetailProps {
  post: Post;
}

export default function PostDetail({ post }: PostDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(post.upvotes?.length || 0);
  const [shares, setShares] = useState(post.shareCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const { socket, on, off } = useSocket();

  React.useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('join_post', post._id);
    }
    const handleNewComment = (data: { postId?: string, post?: string }) => {
      const commentPostId = data.postId || data.post;
      if (commentPostId === post._id) {
        setCommentCount(prev => prev + 1);
      }
    };
    const handleDeleteComment = (data: { postId: string }) => {
      if (data.postId === post._id) {
        setCommentCount(prev => Math.max(prev - 1, 0));
      }
    };
    on('comment:new', handleNewComment);
    on('comment:delete', handleDeleteComment);
    return () => {
      if (socket && socket.connected) {
        socket.emit('leave_post', post._id);
      }
      off('comment:new', handleNewComment);
      off('comment:delete', handleDeleteComment);
    };
  }, [socket, post._id, on, off]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    setShares(shares + 1);
    // Copy link to clipboard
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar
              src={post.author?.avatar}
              alt={post.author?.username || 'User'}
              size="lg"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {post.author?.username || 'Anonymous'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-6">
            <p className="text-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-6 space-y-4">
              {post.media.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      className="w-full max-h-[600px] object-contain bg-black"
                    />
                  ) : (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-white/10 group/media">
                      <Image
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/media:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/media:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <PostActions
            postId={post._id}
            likes={likes}
            comments={commentCount}
            shares={shares}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            onLike={handleLike}
            onComment={() => { }}
            onShare={handleShare}
            onBookmark={handleBookmark}
          />
        </Card>

        {/* Comments Section */}
        <Card className="mt-6 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Comments ({commentCount})
          </h3>
          <CommentList postId={post._id} />
        </Card>
      </motion.div>
    </div>
  );
}
