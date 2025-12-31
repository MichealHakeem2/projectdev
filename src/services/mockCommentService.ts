import { Comment } from "./commentService";

const MOCK_COMMENTS_KEY = "mockComments";

const generateMockComment = (data: Partial<Comment>): Comment => {
  const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return {
    _id: id,
    postId: data.postId || "",
    userId: {
      _id:
        data.userId?._id ||
        data.userId?.id ||
        currentUser.id ||
        currentUser._id ||
        "user_1",
      id:
        data.userId?._id ||
        data.userId?.id ||
        currentUser.id ||
        currentUser._id ||
        "user_1",
      username: data.userId?.username || "Anonymous",
      avatar:
        data.userId?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          data.userId?.username || "User"
        )}&background=3B82F6&color=fff`,
    },
    content: data.content || "",
    parentId: data.parentId,
    likes: data.likes || [],
    replies: data.replies || [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const getMockComments = (): Comment[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_COMMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveMockComments = (comments: Comment[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_COMMENTS_KEY, JSON.stringify(comments));
  }
};

export const mockCommentService = {
  getCommentsByPost: async (postId: string): Promise<Comment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const allComments = getMockComments();
    return allComments.filter((c) => c.postId === postId && !c.parentId);
  },

  getReplies: async (commentId: string): Promise<Comment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const allComments = getMockComments();
    return allComments.filter((c) => c.parentId === commentId);
  },

  createComment: async (data: {
    postId: string;
    content: string;
    parentId?: string;
  }): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const comments = getMockComments();

    const newComment = generateMockComment({
      postId: data.postId,
      content: data.content,
      parentId: data.parentId,
      userId: {
        _id: currentUser.id || currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
    });

    comments.push(newComment);
    saveMockComments(comments);
    return newComment;
  },

  updateComment: async (
    commentId: string,
    data: { content: string }
  ): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const comments = getMockComments();
    const index = comments.findIndex((c) => c._id === commentId);

    if (index === -1) throw new Error("Comment not found");

    comments[index] = {
      ...comments[index],
      content: data.content,
      updatedAt: new Date().toISOString(),
    };

    saveMockComments(comments);
    return comments[index];
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const comments = getMockComments();
    const filtered = comments.filter(
      (c) => c._id !== commentId && c.parentId !== commentId
    );
    saveMockComments(filtered);
  },

  likeComment: async (commentId: string): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const comments = getMockComments();
    const comment = comments.find((c) => c._id === commentId);

    if (!comment) throw new Error("Comment not found");
    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
    }

    saveMockComments(comments);
    return comment;
  },

  unlikeComment: async (commentId: string): Promise<Comment> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = currentUser.id || currentUser._id;
    const comments = getMockComments();
    const comment = comments.find((c) => c._id === commentId);

    if (!comment) throw new Error("Comment not found");
    comment.likes = comment.likes.filter((id) => id !== userId);

    saveMockComments(comments);
    return comment;
  },
};
