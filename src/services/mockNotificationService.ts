import { Notification } from "./notificationService";

const MOCK_NOTIFICATIONS_KEY = "mockNotifications";

const generateMockNotification = (data: Partial<Notification>): Notification => {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    _id: id,
    userId: data.userId || "user_1",
    type: data.type || "like",
    title: data.title || "Notification",
    message: data.message || "",
    link: data.link,
    isRead: data.isRead || false,
    sender: data.sender,
    createdAt: data.createdAt || new Date().toISOString(),
  };
};

const getMockNotifications = (): Notification[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_NOTIFICATIONS_KEY);
  if (!stored) {
    // Initialize with sample notifications
    const sampleNotifications: Notification[] = [
      generateMockNotification({
        type: "like",
        title: "New Like",
        message: "Sarah Johnson liked your post",
        sender: {
          _id: "user_2",
          username: "Sarah Johnson",
          avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=A855F7&color=fff",
        },
        link: "/feed",
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      }),
      generateMockNotification({
        type: "comment",
        title: "New Comment",
        message: "Michael Chen commented on your post",
        sender: {
          _id: "user_3",
          username: "Michael Chen",
          avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=06B6D4&color=fff",
        },
        link: "/feed",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
      generateMockNotification({
        type: "follow",
        title: "New Follower",
        message: "Emma Davis started following you",
        sender: {
          _id: "user_4",
          username: "Emma Davis",
          avatar: "https://ui-avatars.com/api/?name=Emma+Davis&background=10B981&color=fff",
        },
        link: "/profile/user_4",
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(sampleNotifications));
    return sampleNotifications;
  }
  return JSON.parse(stored);
};

const saveMockNotifications = (notifications: Notification[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

export const mockNotificationService = {
  getNotifications: async (
    page = 1,
    limit = 20
  ): Promise<{ notifications: Notification[]; hasMore: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const allNotifications = getMockNotifications();
    const userNotifications = allNotifications.filter((n) => n.userId === userId);
    const start = (page - 1) * limit;
    const end = start + limit;
    const notifications = userNotifications.slice(start, end);
    return { notifications, hasMore: end < userNotifications.length };
  },

  getUnreadNotifications: async (): Promise<Notification[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const allNotifications = getMockNotifications();
    return allNotifications.filter((n) => n.userId === userId && !n.isRead);
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const notifications = getMockNotifications();
    const index = notifications.findIndex((n) => n._id === notificationId);
    if (index !== -1) {
      notifications[index].isRead = true;
      saveMockNotifications(notifications);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const notifications = getMockNotifications();
    notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    saveMockNotifications(notifications);
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const notifications = getMockNotifications();
    const filtered = notifications.filter((n) => n._id !== notificationId);
    saveMockNotifications(filtered);
  },

  getUnreadCount: async (): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const allNotifications = getMockNotifications();
    return allNotifications.filter((n) => n.userId === userId && !n.isRead).length;
  },

  updatePreferences: async (preferences: any): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences));
  },

  getPreferences: async (): Promise<any> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const stored = localStorage.getItem("notificationPreferences");
    return stored ? JSON.parse(stored) : {};
  },
};



