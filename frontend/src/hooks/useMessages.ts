import { useState, useEffect, useCallback } from "react";
import messageService, {
  Message,
  Conversation,
} from "@/services/messageService";
import { useSocket } from "./useSocket";
import { useAuth } from "./useAuth";

export const useMessages = (recipientId?: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { on, off, emit, isConnected } = useSocket();

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (isConnected && currentUserId) {
      emit("join", currentUserId);
    }
  }, [isConnected, user, emit]);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err: unknown) {
      console.error("Failed to load conversations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversations";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      setIsMessagesLoading(true);
      setError(null);
      const data = await messageService.getMessages(id);
      setMessages(data.messages);
    } catch (err: unknown) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await messageService.markAsRead(id);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setConversations((prev) =>
        prev.map((c) =>
          c.participants.some((p) => p._id === id)
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const handleUserStatus = useCallback(
    ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: status === "online" } : p
          ),
        }))
      );
    },
    []
  );

  const handleMessagesRead = useCallback(
    ({ userId: readerId }: { userId: string }) => {
      if (readerId === recipientId) {
        setMessages((prev) =>
          prev.map((m) => (m.receiverId._id === readerId ? { ...m, isRead: true } : m))
        );
      }
      setConversations((prev) =>
        prev.map((c) => {
          const isTargetConv = c.participants.some((p) => p._id === readerId);
          if (isTargetConv && c.lastMessage && c.lastMessage.receiverId._id === readerId) {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, isRead: true },
            };
          }
          return c;
        })
      );
    },
    [recipientId]
  );

  const handleNewMessage = useCallback(
    (message: Message) => {
      // 1. Update current messages if it's the active conversation
      const currentUserId = user?.id || user?._id;
      const isFromRecipient = message.senderId._id === recipientId;
      const isToRecipient = message.receiverId._id === recipientId;

      if (isFromRecipient || isToRecipient) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // Automatically mark as read if it's the active conversation and from the recipient
        if (isFromRecipient) {
          markAsRead(recipientId!);
        }
      }

      // 2. Update conversations list
      setConversations((prev) => {
        const otherPersonId =
          message.senderId._id === currentUserId
            ? message.receiverId._id
            : message.senderId._id;

        const existingConvIndex = prev.findIndex((c) =>
          c.participants.some((p) => p._id === otherPersonId)
        );

        if (existingConvIndex > -1) {
          const updatedConv = {
            ...prev[existingConvIndex],
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount:
              isFromRecipient && !isToRecipient && !message.isRead
                ? prev[existingConvIndex].unreadCount + 1
                : prev[existingConvIndex].unreadCount,
          };
          const newConvs = [...prev];
          newConvs.splice(existingConvIndex, 1);
          return [updatedConv, ...newConvs];
        } else {
          // Fetch conversations again to get the new one properly structured
          loadConversations();
          return prev;
        }
      });
    },
    [recipientId, user, loadConversations, markAsRead]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (recipientId) {
      loadMessages(recipientId);
      markAsRead(recipientId);
    } else {
      setMessages([]);
    }
  }, [recipientId, loadMessages, markAsRead]);

  useEffect(() => {
    on("message", handleNewMessage);
    on("messages_read", handleMessagesRead);
    on("user_status", handleUserStatus);
    return () => {
      off("message", handleNewMessage);
      off("messages_read", handleMessagesRead);
      off("user_status", handleUserStatus);
    };
  }, [on, off, handleNewMessage, handleMessagesRead, handleUserStatus]);

  const sendMessage = async (content: string) => {
    if (!recipientId) return;
    try {
      const newMessage = await messageService.sendMessage({
        receiverId: recipientId,
        content,
      });
      // The socket might emit the message back to us, or we add it manually
      handleNewMessage(newMessage);
      return newMessage;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  return {
    conversations,
    messages,
    isLoading,
    isMessagesLoading,
    error,
    sendMessage,
    markAsRead,
    refreshConversations: loadConversations,
    refreshMessages: loadMessages,
  };
};
