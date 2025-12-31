"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Input from '@/components/common/Input';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import Spinner from '@/components/common/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { conversations, isLoading } = useMessages();

  const selectedConversation = conversations.find(c => c._id === selectedConversationId) || null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Auto-select first conversation on desktop if none selected
    if (conversations.length > 0 && window.innerWidth >= 1024 && !selectedConversationId) {
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.participants[0].username
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
      {/* Conversations Sidebar */}
      <div
        className={`w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col ${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              activeConversationId={selectedConversation?._id}
              onSelectConversation={handleSelectConversation}
            />
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation._id}
            recipientId={selectedConversation.participants[0]._id}
            recipientName={selectedConversation.participants[0].username}
            recipientAvatar={selectedConversation.participants[0].avatar}
            isOnline={selectedConversation.participants[0].isOnline}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
