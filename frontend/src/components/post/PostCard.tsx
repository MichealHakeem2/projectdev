"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, ExternalLink, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import postService, { Post } from '@/services/postService';
import { formatTimeAgo } from '@/utils/dateHelpers';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import CommentList from '../comment/CommentList';
import { useAuth } from '@/hooks/useAuth';
import Badge from '../common/Badge';
import RichText from '../common/RichText';
import EditPostModal from './EditPostModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { useToast } from '@/app/providers';
import { useSocket } from '@/hooks/useSocket';
import MessageButton from "../common/MessageButton";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onUpdate?: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post: initialPost, onLike, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || '';
  const router = useRouter();
  const { showToast } = useToast();

  const [post, setPost] = useState(initialPost);

  const [upvotes, setUpvotes] = useState(initialPost.upvotes || []);
  const [downvotes, setDownvotes] = useState(initialPost.downvotes || []);
  const [shareCount, setShareCount] = useState(initialPost.shareCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync state with props when initialPost changes (e.g. after refresh)
  React.useEffect(() => {
    setPost(initialPost);
    setUpvotes(initialPost.upvotes || []);
    setDownvotes(initialPost.downvotes || []);
    setShareCount(initialPost.shareCount || 0);
  }, [initialPost]);

  const upvoteList = Array.isArray(upvotes) ? upvotes : [];
  const downvoteList = Array.isArray(downvotes) ? downvotes : [];

  const userVote = upvoteList.includes(userId) ? 'up' : downvoteList.includes(userId) ? 'down' : null;
  const score = upvoteList.length - downvoteList.length;

  const getFullUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

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
      const postLink = `${window.location.origin}/posts/${post._id}`;
      await navigator.clipboard.writeText(postLink);

      const updatedPost = await postService.sharePost(post._id);
      setShareCount(updatedPost.shareCount);

      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to share:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleUpdate = (updatedPost: Post) => {
    setPost(updatedPost);
    if (onUpdate) {
      onUpdate(updatedPost);
    }
  };

  const handleDelete = async () => {
    await postService.deletePost(post._id);
    if (onDelete) {
      onDelete(post._id);
    }
  };

  const handleView = async () => {
    if (!post._id) return;
    try {
      await postService.markViewed(post._id);
    } catch (err) {
      // failed to mark view (silent fail)
    }
  };

  const isOwner = !!userId && (userId === post.author?._id || userId === post.authorId);
  const isAdmin = user?.role === 'admin' || user?.accountType === 'admin';
  const canManage = isOwner || isAdmin;

  const dropdownItems = [
    {
      label: 'Copy Link',
      onClick: () => handleShare(),
      icon: <Share2 className="w-4 h-4" />,
    },
    ...(canManage
      ? [
        {
          label: 'Edit Post',
          onClick: () => setShowEditModal(true),
          icon: <Edit className="w-4 h-4" />,
        },
        {
          label: 'Delete Post',
          onClick: () => setShowDeleteModal(true),
          icon: <Trash2 className="w-4 h-4" />,
          danger: true,
        },
      ]
      : [
        {
          label: 'Report Post',
          onClick: () => showToast('Post reported', 'success'),
          icon: <AlertTriangle className="w-4 h-4" />,
          danger: true,
        },
      ]),
  ];

  const { socket, on, off } = useSocket();

  React.useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('join_post', post._id);
    }

    const handleNewComment = (data: any) => {
      const commentPostId = data.postId || data.post;
      if (commentPostId === post._id) {
        setPost(current => ({
          ...current,
          commentsCount: (current.commentsCount || 0) + 1
        }));
      }
    };

    const handleDeleteComment = (data: { postId: string, commentId: string }) => {
      if (data.postId === post._id) {
        setPost(current => ({
          ...current,
          commentsCount: Math.max((current.commentsCount || 0) - 1, 0)
        }));
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onViewportEnter={handleView}
      className="glass-card group relative p-0 mb-6 overflow-hidden border border-white/20 dark:border-white/5"
    >
      {/* Premium Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => post.author?._id && router.push(`/profile/${post.author._id}`)}>
              <Avatar src={post.author?.avatar} alt={post.author?.username || 'User'} size="md" />
              {post.isPromoted && (
                <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white rounded-full p-0.5 shadow-lg">
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => post.author?._id && router.push(`/profile/${post.author._id}`)}>
                  {post.author?.username || "Anonymous"}
                </h3>
                <Badge variant="primary" size="sm" className="text-[10px] uppercase tracking-tighter py-0">
                  {post.categoryId?.name || post.category || 'Other'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {formatTimeAgo(post.createdAt)}
                {(post.categoryId?.name || post.category) && (
                  <span className="mx-2 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-black uppercase tracking-wider">
                    {post.categoryId?.name || post.category}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.author?._id && post.author._id !== userId && (
              <MessageButton
                userId={post.author._id}
                variant="icon"
                tooltipText="Send Message"
              />
            )}

            {post.isPromoted && (
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">Promotion Trend</span>
            )}
            <Dropdown
              trigger={
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              }
              items={dropdownItems}
            />
          </div>
        </div>
        <div
          className="mb-4 cursor-pointer"
          onClick={() => router.push(`/posts/${post._id}`)}
        >
          <RichText
            content={post.content}
            className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed text-[15px]"
          />
        </div>

        {/* Media Grid */}
        {post.media && post.media.length > 0 && (
          <div className={`mb-4 grid gap-3 rounded-2xl overflow-hidden ${post.media.length === 1 ? 'grid-cols-1' :
            post.media.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
            {post.media.map((item, index) => (
              <div key={index} className={`relative group/media overflow-hidden bg-gray-100 dark:bg-gray-900 ${post.media && post.media.length === 3 && index === 0 ? 'row-span-2' : ''
                }`}>
                {item.type === 'video' ? (
                  <video
                    src={getFullUrl(item.url)}
                    controls
                    className="w-full h-full object-cover max-h-[500px]"
                  />
                ) : (
                  <Image
                    src={getFullUrl(item.url) || ''}
                    alt="Post Media"
                    width={800}
                    height={500}
                    unoptimized={true}
                    className="w-full h-full object-cover max-h-[500px] hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-2 sm:gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
          {/* Enhanced Voting */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-1 border border-gray-100 dark:border-white/5">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => handleVote('up')}
              className={`p-2 rounded-xl transition-all ${userVote === 'up'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40'
                : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <ArrowBigUp className={`w-6 h-6 ${userVote === 'up' ? 'fill-current' : ''}`} />
            </motion.button>
            <span className={`text-sm font-black px-2 min-w-[3ch] text-center ${userVote === 'up' ? 'text-primary-600 dark:text-primary-400' :
              userVote === 'down' ? 'text-secondary-600 dark:text-secondary-400' :
                'text-gray-600 dark:text-gray-300'
              }`}>
              {score > 0 ? `+${score}` : score}
            </span>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => handleVote('down')}
              className={`p-2 rounded-xl transition-all ${userVote === 'down'
                ? 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/40'
                : 'text-gray-400 hover:text-secondary-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <ArrowBigDown className={`w-6 h-6 ${userVote === 'down' ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Comment & Share Buttons */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm ${showComments
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-500/20'
              : 'bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount || 0}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all font-bold text-sm ml-auto sm:ml-0"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">{shareCount} Shares</span>
          </button>

          {/* Engagement Meta */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-auto">
            <span>{post.impressions || 0} Views</span>
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 space-y-6"
            >
              <CommentList postId={post._id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </motion.div>
  );
};

export default PostCard;
