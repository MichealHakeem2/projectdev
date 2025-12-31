import { Message, Conversation, SendMessageData } from "./messageService";

const MOCK_MESSAGES_KEY = "mockMessages";
const MOCK_CONVERSATIONS_KEY = "mockConversations";

const generateMockMessage = (data: Partial<Message>): Message => {
  const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return {
    _id: id,
    senderId: {
      _id: data.senderId?._id || currentUser.id || currentUser._id || "user_1",
      username: data.senderId?.username || "User",
      avatar: data.senderId?.avatar,
    },
    receiverId: {
      _id: data.receiverId?._id || "user_2",
      username: data.receiverId?.username || "Recipient",
      avatar: data.receiverId?.avatar,
    },
    content: data.content || "",
    isRead: data.isRead || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const getMockMessages = (): Message[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_MESSAGES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveMockMessages = (messages: Message[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_MESSAGES_KEY, JSON.stringify(messages));
  }
};

const getMockConversations = (): Conversation[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_CONVERSATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveMockConversations = (conversations: Conversation[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
};

export const mockMessageService = {
  getConversations: async (): Promise<Conversation[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const conversations = getMockConversations();
    const messages = getMockMessages();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;

    if (conversations.length === 0 && messages.length === 0) {
      // Initialize with sample conversation
      const sampleConversation: Conversation = {
        _id: "conv_1",
        participants: [
          {
            _id: "user_2",
            username: "Sarah Johnson",
            avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=A855F7&color=fff",
            isOnline: true,
          },
        ],
        lastMessage: {
          _id: "msg_1",
          senderId: {
            _id: "user_2",
            username: "Sarah Johnson",
            avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=A855F7&color=fff",
          },
          receiverId: {
            _id: userId || "user_1",
            username: currentUser.username || "You",
          },
          content: "Hey! How are you doing?",
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        unreadCount: 1,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };
      saveMockConversations([sampleConversation]);
      return [sampleConversation];
    }

    return conversations;
  },

  getMessages: async (
    userId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: Message[]; hasMore: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const currentUserId = currentUser.id || currentUser._id;
    const allMessages = getMockMessages();

    const conversationMessages = allMessages.filter(
      (m) =>
        (m.senderId._id === currentUserId && m.receiverId._id === userId) ||
        (m.senderId._id === userId && m.receiverId._id === currentUserId)
    );

    const sorted = conversationMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return { messages: sorted, hasMore: false };
  },

  sendMessage: async (data: SendMessageData): Promise<Message> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const messages = getMockMessages();

    const newMessage = generateMockMessage({
      senderId: {
        _id: currentUser.id || currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      receiverId: {
        _id: data.receiverId,
        username: "Recipient",
      },
      content: data.content,
      isRead: false,
    });

    messages.push(newMessage);
    saveMockMessages(messages);

    // Update conversation
    const conversations = getMockConversations();
    const convIndex = conversations.findIndex(
      (c) => c.participants[0]._id === data.receiverId
    );

    if (convIndex !== -1) {
      conversations[convIndex].lastMessage = newMessage;
      conversations[convIndex].updatedAt = new Date().toISOString();
    } else {
      conversations.push({
        _id: `conv_${Date.now()}`,
        participants: [
          {
            _id: data.receiverId,
            username: "Recipient",
            isOnline: false,
          },
        ],
        lastMessage: newMessage,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      });
    }

    saveMockConversations(conversations);
    return newMessage;
  },

  markAsRead: async (userId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const currentUserId = currentUser.id || currentUser._id;
    const messages = getMockMessages();

    messages.forEach((m) => {
      if (m.receiverId._id === currentUserId && m.senderId._id === userId && !m.isRead) {
        m.isRead = true;
      }
    });

    saveMockMessages(messages);

    // Update conversation unread count
    const conversations = getMockConversations();
    const conv = conversations.find((c) => c.participants[0]._id === userId);
    if (conv) {
      conv.unreadCount = 0;
      saveMockConversations(conversations);
    }
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const messages = getMockMessages();
    const filtered = messages.filter((m) => m._id !== messageId);
    saveMockMessages(filtered);
  },

  getUnreadCount: async (): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const conversations = getMockConversations();
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  },
};



