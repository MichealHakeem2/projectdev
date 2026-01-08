"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import postService, { Post, UpdatePostData } from '@/services/postService';
import categoryService, { Category } from '@/services/categoryService';

interface EditPostModalProps {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedPost: Post) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose, onUpdate }) => {
    const [content, setContent] = useState(post.content);
    const [hashtags, setHashtags] = useState(post.hashtags?.join(' ') || '');
    const [category, setCategory] = useState(post.category || '');
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCats, setIsLoadingCats] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCats(true);
            try {
                const data = await categoryService.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoadingCats(false);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate content
            if (!content.trim()) {
                setError('Content cannot be empty');
                setIsLoading(false);
                return;
            }

            if (content.length > 5000) {
                setError('Content must be less than 5000 characters');
                setIsLoading(false);
                return;
            }

            // Parse hashtags
            const hashtagArray = hashtags
                .split(/\s+/)
                .filter(tag => tag.startsWith('#'))
                .map(tag => tag.substring(1));

            const updateData: UpdatePostData = {
                content: content.trim(),
                hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
                category: category || undefined,
            };

            const updatedPost = await postService.updatePost(post._id, updateData);
            onUpdate(updatedPost);
            onClose();
        } catch (err: unknown) {
            const errObj = err as { response?: { data?: { message?: string } } };
            setError(errObj.response?.data?.message || 'Failed to update post');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Post">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Content */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Content
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={6}
                        placeholder="What's on your mind?"
                        maxLength={5000}
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                            {content.length}/5000 characters
                        </span>
                    </div>
                </div>

                {/* Hashtags */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Hashtags (optional)
                    </label>
                    <Input
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="#trending #technology"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Separate hashtags with spaces
                    </p>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Category (optional)
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isLoadingCats}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    >
                        <option value="">{isLoadingCats ? 'Loading...' : 'Select a category'}</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-500/30 rounded-xl"
                    >
                        <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading || !content.trim()}
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        {isLoading ? 'Updating...' : 'Update Post'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditPostModal;
