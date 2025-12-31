"use client";

import React, { useEffect, useState } from 'react';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import communityService from '@/services/communityService';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Input from '../common/Input';

interface MemberListProps {
  communityId: string;
}

export default function MemberList({ communityId }: MemberListProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await communityService.getMembers(communityId);
        setMembers(data);
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, [communityId]);

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search members..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div key={member._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar src={member.avatar} alt={member.username} size="md" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{member.username}</h4>
                  <p className="text-xs text-gray-500">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600">
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-4">
                  Follow
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500">
            No members found matching your search.
          </div>
        )}
      </div>
    </Card>
  );
}
