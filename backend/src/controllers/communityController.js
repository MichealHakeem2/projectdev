const Community = require("../models/community");
const CommunityMember = require("../models/communityMember");

// Get all communities
exports.getCommunities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const communities = await Community.find()
      .populate("creatorId", "fullName username avatarUrl")
      .skip(skip)
      .limit(limit);

    const total = await Community.countDocuments();

    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await CommunityMember.countDocuments({
          communityId: community._id,
        });
        const members = await CommunityMember.find({
          communityId: community._id,
        }).select("userId");

        // Map creatorId to createdBy for frontend compatibility
        const communityData = community.toObject();
        const creator = communityData.creatorId;
        delete communityData.creatorId;

        return {
          ...communityData,
          createdBy: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatarUrl,
                fullName: creator.fullName,
              }
            : null,
          memberCount,
          members: members.map((m) => m.userId),
        };
      })
    );

    res.json({
      success: true,
      data: {
        communities: communitiesWithCounts,
        hasMore: skip + communities.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get community by ID
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id).populate(
      "creatorId",
      "fullName username avatarUrl"
    );
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const memberCount = await CommunityMember.countDocuments({
      communityId: community._id,
    });
    const members = await CommunityMember.find({
      communityId: community._id,
    }).select("userId");

    const communityData = community.toObject();
    const creator = communityData.creatorId;
    delete communityData.creatorId;

    res.json({
      success: true,
      data: {
        ...communityData,
        createdBy: creator
          ? {
              _id: creator._id,
              username: creator.username,
              avatar: creator.avatarUrl,
              fullName: creator.fullName,
            }
          : null,
        memberCount,
        members: members.map((m) => m.userId),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Join community
exports.joinCommunity = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;

    const existingMember = await CommunityMember.findOne({
      communityId,
      userId,
    });
    if (existingMember) {
      return res.status(400).json({ message: "Already a member" });
    }

    await CommunityMember.create({ communityId, userId, role: "member" });

    res.json({
      success: true,
      message: "Joined community successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Leave community
exports.leaveCommunity = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;

    const result = await CommunityMember.findOneAndDelete({
      communityId,
      userId,
    });
    if (!result) {
      return res.status(400).json({ message: "Not a member" });
    }

    res.json({
      success: true,
      message: "Left community successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get user's communities
exports.getUserCommunities = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const members = await CommunityMember.find({ userId }).populate(
      "communityId"
    );

    const communities = await Promise.all(
      members.map(async (m) => {
        if (!m.communityId) return null;

        // Re-fetch with population
        const community = await Community.findById(m.communityId._id).populate(
          "creatorId",
          "fullName username avatarUrl"
        );
        if (!community) return null;

        const memberCount = await CommunityMember.countDocuments({
          communityId: community._id,
        });
        const allMembers = await CommunityMember.find({
          communityId: community._id,
        }).select("userId");

        const communityData = community.toObject();
        const creator = communityData.creatorId;
        delete communityData.creatorId;

        return {
          ...communityData,
          createdBy: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatarUrl,
                fullName: creator.fullName,
              }
            : null,
          memberCount,
          members: allMembers.map((am) => am.userId),
        };
      })
    );

    res.json({
      success: true,
      data: communities.filter((c) => c !== null),
    });
  } catch (error) {
    next(error);
  }
};

// Create community
exports.createCommunity = async (req, res, next) => {
  try {
    const { name, description, isPrivate, category } = req.body;

    const communityData = {
      name,
      description,
      category,
      isPrivate: isPrivate === "true",
      creatorId: req.user._id,
      moderators: [req.user._id],
    };

    if (req.files && req.files.length > 0) {
      communityData.coverImage = `/uploads/${req.files[0].filename}`;
    }

    const community = await Community.create(communityData);

    await CommunityMember.create({
      communityId: community._id,
      userId: req.user._id,
      role: "admin",
    });

    // Populate for return
    const populatedCommunity = await Community.findById(community._id).populate(
      "creatorId",
      "fullName username avatarUrl"
    );
    const finalData = populatedCommunity.toObject();
    const creator = finalData.creatorId;
    delete finalData.creatorId;

    res.status(201).json({
      success: true,
      data: {
        ...finalData,
        createdBy: creator
          ? {
              _id: creator._id,
              username: creator.username,
              avatar: creator.avatarUrl,
              fullName: creator.fullName,
            }
          : null,
        memberCount: 1,
        members: [req.user._id.toString()],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update community
exports.updateCommunity = async (req, res, next) => {
  try {
    const { name, description, isPrivate, category } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (community.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = {
      name: name || community.name,
      description: description || community.description,
      category: category || community.category,
      isPrivate:
        isPrivate !== undefined ? isPrivate === "true" : community.isPrivate,
    };

    if (req.files && req.files.length > 0) {
      updates.coverImage = `/uploads/${req.files[0].filename}`;
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("creatorId", "fullName username avatarUrl");

    const communityData = updatedCommunity.toObject();
    const creator = communityData.creatorId;
    delete communityData.creatorId;

    res.json({
      success: true,
      data: {
        ...communityData,
        createdBy: creator
          ? {
              _id: creator._id,
              username: creator.username,
              avatar: creator.avatarUrl,
              fullName: creator.fullName,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search communities
exports.searchCommunities = async (req, res, next) => {
  try {
    const query = req.query.q || "";
    const communities = await Community.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).populate("creatorId", "fullName username avatarUrl");

    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await CommunityMember.countDocuments({
          communityId: community._id,
        });
        const members = await CommunityMember.find({
          communityId: community._id,
        }).select("userId");

        const communityData = community.toObject();
        const creator = communityData.creatorId;
        delete communityData.creatorId;

        return {
          ...communityData,
          createdBy: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatarUrl,
                fullName: creator.fullName,
              }
            : null,
          memberCount,
          members: members.map((m) => m.userId),
        };
      })
    );

    res.json({
      success: true,
      data: communitiesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// Get community members
exports.getMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const members = await CommunityMember.find({ communityId: id })
      .populate("userId", "username fullName avatarUrl accountType")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CommunityMember.countDocuments({ communityId: id });

    const membersData = members.map((m) => ({
      _id: m.userId._id,
      username: m.userId.username,
      fullName: m.userId.fullName,
      avatar: m.userId.avatarUrl,
      accountType: m.userId.accountType,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    res.json({
      success: true,
      data: {
        members: membersData,
        hasMore: skip + members.length < total,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getCommunitiesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const communities = await Community.find({ category }).populate(
      "creatorId",
      "fullName username avatarUrl"
    );

    const communitiesWithCounts = await Promise.all(
      communities.map(async (community) => {
        const memberCount = await CommunityMember.countDocuments({
          communityId: community._id,
        });
        const members = await CommunityMember.find({
          communityId: community._id,
        }).select("userId");

        const communityData = community.toObject();
        const creator = communityData.creatorId;
        delete communityData.creatorId;

        return {
          ...communityData,
          createdBy: creator
            ? {
                _id: creator._id,
                username: creator.username,
                avatar: creator.avatarUrl,
                fullName: creator.fullName,
              }
            : null,
          memberCount,
          members: members.map((m) => m.userId),
        };
      })
    );

    res.json({
      success: true,
      data: communitiesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};
