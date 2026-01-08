"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PostCard from '@/components/post/PostCard';
import postService, { Post } from '@/services/postService';
import Spinner from '@/components/common/Spinner';
import TrendingTopics from '@/components/trend/TrendingTopics';
import SuggestedBusiness from '@/components/business/SuggestedBusiness';
import ConnectionSuggestions from '@/components/profile/ConnectionSuggestions';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostDetailPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const loadPost = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await postService.getPost(id);
            setPost(data);
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Failed to load post:', error);
            setError(error.message || 'Failed to load post');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadPost();
        }
    }, [isAuthenticated, loadPost]);

    if (authLoading || (isLoading && !post)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
                <div className="text-center">
                    <h1 className="text-8xl font-black text-gray-200 dark:text-gray-800 mb-4 animate-pulse">404</h1>
                    <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/feed')}
                        className="px-8 py-3 bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 transition-all"
                    >
                        Back to Home
                    </motion.button>
                </div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-transparent relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="hidden lg:block space-y-6 lg:col-span-3">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => router.push('/feed')}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 text-gray-500 hover:text-primary-500 transition-all mb-6 font-black uppercase text-[10px] tracking-[0.2em] group shadow-premium"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Feed
                        </motion.button>
                        <TrendingTopics />
                        <SuggestedBusiness />
                    </div>

                    {/* Main Content */}
                    <main className="lg:col-span-6 space-y-6">
                        <div className="lg:hidden mb-6">
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => router.push('/feed')}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 text-gray-500 hover:text-primary-500 transition-all font-black uppercase text-[10px] tracking-[0.2em] group shadow-premium"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back
                            </motion.button>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <PostCard
                                post={post}
                                onDelete={() => router.push('/feed')}
                            />
                        </motion.div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3 space-y-6">
                        <ConnectionSuggestions />
                    </aside>
                </div>
            </div>
        </div>
    );
}
