const Message = require("../models/Message");
const User = require("../models/user");
const mongoose = require("mongoose");

// Get all conversations for a user
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find unique conversations
    const messages = await Message.aggregate([{
        $match: {
          $or: [{
            sender: userId
          }, {
            receiver: userId
          }],
        },
      },
      {
        $sort: {
          createdAt: -1
        },
      },
      {
        $group: {
          _id: {
            $cond: [{
              $eq: ["$sender", userId]
            }, "$receiver", "$sender"],
          },
          lastMessage: {
            $first: "$$ROOT"
          },
          unreadCount: {
            $sum: {
              $cond: [{
                  $and: [{
                      $eq: ["$receiver", userId]
                    },
                    {
                      $eq: ["$read", false]
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Populate participant info
    const populatedConversations = await Promise.all(
      messages.map(async (conv) => {
        const participant = await User.findById(conv._id).select(
          "username fullName avatarUrl"
        );
        if (!participant) return null;

        const onlineUsers = req.app.get("onlineUsers");
        const isOnline = onlineUsers ? onlineUsers.has(participant._id.toString()) : false;

        return {
          _id: conv.lastMessage._id, // Just an ID for the conversation entry
          participants: [{
            _id: participant._id,
            username: participant.username,
            fullName: participant.fullName,
            avatar: participant.avatarUrl,
            isOnline: isOnline,
          }, ],
          lastMessage: {
            _id: conv.lastMessage._id,
            senderId: {
              _id: conv.lastMessage.sender
            },
            receiverId: {
              _id: conv.lastMessage.receiver
            },
            content: conv.lastMessage.content,
            isRead: conv.lastMessage.read,
            createdAt: conv.lastMessage.createdAt,
          },
          unreadCount: conv.unreadCount,
          updatedAt: conv.lastMessage.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: populatedConversations.filter((c) => c !== null),
    });
  } catch (error) {
    next(error);
  }
};

// Get messages with a specific user
exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.friendId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
        $or: [{
            sender: userId,
            receiver: friendId
          },
          {
            sender: friendId,
            receiver: userId
          },
        ],
      })
      .populate("sender", "username avatarUrl")
      .populate("receiver", "username avatarUrl")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      $or: [{
          sender: userId,
          receiver: friendId
        },
        {
          sender: friendId,
          receiver: userId
        },
      ],
    });

    // Map to frontend format
    const formattedMessages = messages
      .map((m) => ({
        _id: m._id,
        senderId: {
          _id: m.sender._id,
          username: m.sender.username,
          avatar: m.sender.avatarUrl,
        },
        receiverId: {
          _id: m.receiver._id,
          username: m.receiver.username,
          avatar: m.receiver.avatarUrl,
        },
        content: m.content,
        isRead: m.read,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }))
      .reverse(); // Oldest first for chat window

    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send a message via API (fallback or standard)
exports.sendMessage = async (req, res, next) => {
  try {
    const {
      receiverId,
      content
    } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // Message created successfully without AI analysis

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username avatarUrl")
      .populate("receiver", "username avatarUrl");

    const formattedMessage = {
      _id: populatedMessage._id,
      senderId: {
        _id: populatedMessage.sender._id,
        username: populatedMessage.sender.username,
        avatar: populatedMessage.sender.avatarUrl,
      },
      receiverId: {
        _id: populatedMessage.receiver._id,
        username: populatedMessage.receiver.username,
        avatar: populatedMessage.receiver.avatarUrl,
      },
      content: populatedMessage.content,
      isRead: populatedMessage.read,
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
    };

    // Emit socket event if io is available
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("message", formattedMessage);
    }

    res.status(201).json({
      success: true,
      data: formattedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.friendId;

    await Message.updateMany({
      sender: friendId,
      receiver: userId,
      read: false
    }, {
      $set: {
        read: true
      }
    });

    // Emit socket event to the sender (friendId)
    const io = req.app.get("io");
    if (io) {
      io.to(friendId.toString()).emit("messages_read", {
        userId: userId, // The person who read the messages
      });
    }

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({
        error: "No file uploaded",
      });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const {
      messageId
    } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        error: "Message not found"
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Unauthorized"
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: "Message deleted successfully",
      data: {
        messageId
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({
      receiver: userId,
      read: false,
    });
    res.json({
      success: true,
      data: {
        count
      },
    });
  } catch (error) {
    next(error);
  }
};