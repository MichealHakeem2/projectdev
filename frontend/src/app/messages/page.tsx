"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Edit } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/common/Input";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import Spinner from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { Conversation } from "@/services/messageService";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import UserSearchModal from "@/components/messaging/UserSearchModal";
import { User } from "@/services/userService";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [tempRecipient, setTempRecipient] = useState<User | null>(null);

  const { conversations = [], isLoading } = useMessages();

  // Handle query parameter for selected conversation
  useEffect(() => {
    const conversationId = searchParams.get("conversationId");
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const getRecipient = useCallback((conversation: Conversation) => {
    return (
      conversation.participants.find((p: { _id: string }) => p._id !== user?._id) ||
      conversation.participants[0]
    );
  }, [user]);

  useEffect(() => {
    if (
      conversations.length > 0 &&
      typeof window !== "undefined" &&
      window.innerWidth >= 1024 &&
      !selectedConversationId &&
      !tempRecipient
    ) {
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId, tempRecipient]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const recipient = getRecipient(conversation);
      return recipient?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, getRecipient]);

  const handleSelectUser = (selectedUser: User) => {
    setShowUserSearch(false);

    // Check if conversation already exists
    const existingConv = conversations.find(c =>
      c.participants.some(p => p._id === selectedUser._id)
    );

    if (existingConv) {
      setSelectedConversationId(existingConv._id);
      setTempRecipient(null);
    } else {
      setSelectedConversationId(`temp-${selectedUser._id}`);
      setTempRecipient(selectedUser);
    }
  };

  if (authLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
      {/* Conversations Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: selectedConversationId && typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 'auto' }}
        className={`w-full lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all ${selectedConversationId ? "hidden lg:flex" : "flex"
          }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Messages
            </h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              activeConversationId={selectedConversationId || undefined}
              onSelectConversation={(id) => {
                setSelectedConversationId(id);
                setTempRecipient(null);
              }}
            />
          )}
        </div>
      </motion.aside>

      {/* Chat Window */}
      <main
        className={`flex-1 flex flex-col ${!selectedConversationId ? "hidden lg:flex" : "flex"
          }`}
      >
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation._id}
            recipientId={getRecipient(selectedConversation)._id}
            recipientName={getRecipient(selectedConversation).username}
            recipientAvatar={getRecipient(selectedConversation).avatar}
            isOnline={getRecipient(selectedConversation).isOnline}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : selectedConversationId &&
          selectedConversationId.startsWith("temp-") && tempRecipient ? (
          // Handle temp conversation ID for new chats
          <ChatWindow
            conversationId={selectedConversationId}
            recipientId={tempRecipient._id}
            recipientName={tempRecipient.username}
            recipientAvatar={tempRecipient.avatar}
            isOnline={false}
            onBack={() => {
              setSelectedConversationId(null);
              setTempRecipient(null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950 text-center p-6">
            <div className="max-w-sm">
              <div className="bg-gray-100 dark:bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the list or start a new one to begin
                messaging.
              </p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full font-bold hover:bg-primary-600 transition-colors"
              >
                Send a Message
              </button>
            </div>
          </div>
        )}
      </main>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <UserSearchModal
            onClose={() => setShowUserSearch(false)}
            onSelectUser={handleSelectUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
