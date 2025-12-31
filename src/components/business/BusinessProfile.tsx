"use client";

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Users, 
  CheckCircle, 
  Calendar,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import businessService, { Business } from '@/services/businessService';
import postService, { Post } from '@/services/postService';
import { useAuth } from '@/hooks/useAuth';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import PostCard from '../post/PostCard';
import ReputationBadge from './ReputationBadge';

interface BusinessProfileProps {
  businessId: string;
}

export default function BusinessProfile({ businessId }: BusinessProfileProps) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bizData, postsData] = await Promise.all([
          businessService.getBusiness(businessId),
          postService.getBusinessPosts(businessId)
        ]);
        setBusiness(bizData);
        setPosts(postsData.posts || []);
        
        const currentUserId = user?.id || (user as any)?._id;
        if (currentUserId && bizData.followers.includes(currentUserId)) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error('Failed to load business profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (businessId) loadData();
  }, [businessId, user]);

  const handleFollow = async () => {
    if (!business) return;
    try {
      if (isFollowing) {
        await businessService.unfollowBusiness(businessId);
        setIsFollowing(false);
      } else {
        await businessService.followBusiness(businessId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!business) {
    return (
      <Card className="p-10 text-center">
        <p className="text-gray-500">Business not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary-600 via-indigo-600 to-secondary-600 relative">
          {business.coverImage && (
            <img 
              src={business.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="p-1 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
              <Avatar 
                src={business.logo} 
                alt={business.name} 
                size="xl" 
                className="w-32 h-32 rounded-xl object-cover"
              />
            </div>
            
            <div className="flex gap-3 mb-2">
              <Button 
                variant={isFollowing ? 'outline' : 'primary'}
                onClick={handleFollow}
                className="rounded-full px-8"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="ghost" size="sm" className="p-2 rounded-full border border-gray-200 dark:border-gray-800">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 rounded-full border border-gray-200 dark:border-gray-800">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{business.name}</h1>
                {business.verified && <CheckCircle className="w-6 h-6 text-blue-500 fill-current" />}
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{business.description}</p>
              
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                {business.address?.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address.city}, {business.address.country}</span>
                  </div>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(business.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-3 min-w-[200px]">
              <ReputationBadge score={business.reputationScore} size="md" />
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{business.followers.length}</span>
                <span className="text-gray-500">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About & Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {business.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{business.email}</p>
                  </div>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{business.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Category</h3>
            <Badge variant="primary" size="lg">{business.category}</Badge>
          </Card>
        </div>

        {/* Posts Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Posts</h2>
          </div>
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post._id} post={post} />)
          ) : (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No posts yet from this business</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
