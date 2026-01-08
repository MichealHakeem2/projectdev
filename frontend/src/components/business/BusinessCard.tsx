"use client";

import React from 'react';
import Link from 'next/link';
import { MapPin, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Business } from '@/services/businessService';

interface BusinessCardProps {
  business: Business;
  onFollow?: () => void;
  isFollowing?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onFollow, isFollowing }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        {/* Cover Image */}
        {business.coverImage && (
          <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500 relative">
            <img
              src={business.coverImage}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5">
          {/* Logo and Name */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-16 h-16 rounded-lg object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl border-4 border-white shadow-md">
                  {business.name.charAt(0)}
                </div>
              )}
              {business.verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/business/${business._id}`}>
                <h3 className="font-bold text-lg text-gray-900 hover:text-primary-600 transition-colors truncate">
                  {business.name}
                </h3>
              </Link>
              <Badge variant="secondary" size="sm">
                {business.category}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {business.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{business.followers.length} followers</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{business.reputationScore} reputation</span>
            </div>
          </div>

          {/* Location */}
          {business.address?.city && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <MapPin className="w-4 h-4" />
              <span>
                {business.address.city}
                {business.address.country && `, ${business.address.country}`}
              </span>
            </div>
          )}

          {/* Action Button */}
          {onFollow && (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              onClick={onFollow}
              className="w-full"
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BusinessCard;
