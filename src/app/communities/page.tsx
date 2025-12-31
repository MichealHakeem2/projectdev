"use client";

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import CommunityList from '@/components/community/CommunityList';
import CommunityCreateModal from '@/components/community/CommunityCreateModal';

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    'All',
    'Technology',
    'Business',
    'Marketing',
    'Design',
    'Finance',
    'Healthcare',
    'Education',
    'Entertainment',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Communities</h1>
              <p className="text-gray-600">
                Discover and join communities around your interests
              </p>
            </div>
            <Button 
              variant="primary" 
              className="flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Create Community
            </Button>
          </div>

          <CommunityCreateModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              // Usually we'd refresh the list here
              setIsModalOpen(false);
            }}
          />

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  (category === 'All' && !selectedCategory) ||
                  category === selectedCategory
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Communities List */}
        <CommunityList
          searchQuery={searchQuery}
          category={selectedCategory}
        />
        </div>
      </div>
    </div>
  );
}
