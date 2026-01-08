const CommunityMessage = require("../models/communitymessage");
const CommunityMember = require("../models/communityMember");

exports.getCommunityMessages = async (req, res, next) => {
  try {
    const {
      communityId
    } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify membership
    const isMember = await CommunityMember.findOne({
      communityId,
      userId: req.user._id,
    });
    if (!isMember) {
      return res
        .status(403)
        .json({
          message: "Only members can view messages"
        });
    }

    const messages = await CommunityMessage.find({
        communityId
      })
      .populate("senderId", "username fullName avatarUrl")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.sendCommunityMessage = async (req, res, next) => {
  try {
    const {
      communityId: paramCommunityId
    } = req.params;
    const {
      content,
      isAnnouncement: announcementInput
    } = req.body;

    const communityId = paramCommunityId || req.body.communityId;

    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: "Community ID is required"
      });
    }

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Message content or media is required"
      });
    }

    const isAnnouncement = announcementInput === 'true' || announcementInput === true;

    // Verify membership
    const membership = await CommunityMember.findOne({
      communityId,
      userId: req.user._id,
    });
    if (!membership) {
      return res
        .status(403)
        .json({
          message: "Only members can send messages"
        });
    }

    // If announcement, verify admin role
    if (isAnnouncement && membership.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "Only admins can make announcements"
        });
    }

    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        media.push({
          type: file.mimetype.startsWith("video/") ? "video" : "image",
          url: `/uploads/${file.filename}`,
        });
      });
    }

    const message = await CommunityMessage.create({
      communityId,
      senderId: req.user._id,
      content: content || ' ', // space fallback for media-only messages
      media,
      isAnnouncement: isAnnouncement || false,
    });

    // Message created successfully without AI analysis

    const populatedMessage = await CommunityMessage.findById(
      message._id
    ).populate("senderId", "username fullName avatarUrl");

    // Socket emission
    const io = req.app.get("io");
    if (io) {
      io.to(`community:${communityId}`).emit(
        "community_message",
        populatedMessage
      );
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};