const Post = require("../models/post");
const Business = require("../models/business");
const mongoose = require("mongoose");
const reputationService = require("../services/reputationService");
const badgeService = require("../services/badgeService");
const Category = require("../models/category");
const Hashtag = require("../models/Hashtag");
const Keyword = require("../models/keyword");
const Trend = require("../models/trend");
// const PostHashtag = require("../models/postHashtag");
const Badge = require("../models/badge");

/**
 * Formats a post for the frontend by mapping IDs to descriptive keys.
 */
const formatPost = (post) => {
  if (!post) return null;

  const p = post.toObject ? post.toObject() : post;
  const author = p.authorId;
  const business = p.businessId;

  delete p.authorId;
  delete p.businessId;

  return {
    ...p,
    author: author && typeof author === 'object' ? {
      _id: author._id,
      username: author.username || 'Anonymous',
      fullName: author.fullName || author.username || 'Anonymous',
      avatar: author.avatarUrl || author.avatar,
      accountType: author.accountType || 'individual',
    } : null,
    business: business && typeof business === 'object' ? {
      _id: business._id,
      name: business.name,
      logo: business.avatarUrl || business.logo,
    } : null,
  };
};

const extractAndUpsertHashtags = async (content, postId = null) => {
  if (!content) return [];

  const regex = /#(\w+)/g;
  const matches = content.match(regex);

  if (!matches) return [];

  const tags = [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
  const hashtagIds = [];

  for (const tagName of tags) {
    try {
      let hashtag = await Hashtag.findOne({
        name: tagName
      });

      if (hashtag) {
        hashtag.count += 1;
        hashtag.lastUsedAt = Date.now();
        if (postId && !hashtag.posts.includes(postId)) {
          hashtag.posts.push(postId);
        }
        await hashtag.save();
      } else {
        hashtag = await Hashtag.create({
          name: tagName,
          count: 1,
          posts: postId ? [postId] : []
        });
      }
      hashtagIds.push(hashtag._id);
    } catch (err) {
      console.error("Error processing hashtag:", err);
    }
  }

  return hashtagIds;
};

exports.createPost = async (req, res, next) => {
  console.log('=== CREATE POST CALLED ===');
  console.log('User:', req.user && (req.user._id || req.user.id));
  console.log('Body:', req.body);
  console.log('Files:', req.files);

  try {
    const {
      content,
      categoryId,
      tag,
      businessId,
      communityId
    } = req.body;

    const media = [];

    // Handle multiple file uploads
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const isVideo = file.mimetype.startsWith('video/');
        media.push({
          type: isVideo ? 'video' : 'image',
          url: `/uploads/${file.filename}`
        });
      });
    } else if (req.file) {
      // Handle single file upload just in case
      const isVideo = req.file.mimetype.startsWith('video/');
      media.push({
        type: isVideo ? 'video' : 'image',
        url: `/uploads/${req.file.filename}`
      });
    }

    // Resolve category name to ID if needed
    let resolvedCategoryId = categoryId;
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      const category = await Category.findOne({
        name: new RegExp("^" + categoryId + "$", "i"),
      });
      if (category) {
        resolvedCategoryId = category._id;
      } else {
        resolvedCategoryId = null;
      }
    }

    const postData = {
      content,
      authorId: req.user._id || req.user.id,
      media,
      mediaUrl: media.length > 0 ? media[0].url : undefined, // Compatibility
      categoryId: resolvedCategoryId,
      hashtags: [], // Will be populated after post creation
      tag,
      businessId: businessId || req.user.businessId,
      communityId: communityId || null,
      impressions: 0,
      trendScore: 0, // Initial score based on impressions/1000 = 0
    };

    const post = await Post.create(postData);

    // Extract and link hashtags after post is created
    console.log(`[Post] Extracting hashtags for post ${post._id}`);
    const hashtags = await extractAndUpsertHashtags(content, post._id);
    console.log(`[Post] Found ${hashtags.length} hashtags`);
    if (hashtags.length > 0) {
      post.hashtags = hashtags;
      await post.save();
    }

    const populatedPost = await Post.findById(post._id)
      .populate('authorId', 'username fullName avatarUrl accountType')
      .populate('businessId', 'name avatarUrl')
      .populate('categoryId', 'name')
      .populate('hashtags', 'name');

    const formattedPost = formatPost(populatedPost);

    // Emit POST_CREATED event for trend tracking and reputation
    const eventBus = require('../utils/eventBus');
    eventBus.emit(eventBus.EVENTS.POST_CREATED, {
      post: populatedPost,
      user: req.user
    });

    // Emit live post - only to general feed if not a community post
    const io = req.app.get("io");
    if (io) {
      if (communityId) {
        // Emit to community-specific room
        io.to(`community:${communityId}`).emit("post:new", formattedPost);
      } else {
        // Emit to general feed
        io.emit("post:new", formattedPost);
      }
    }

    res.status(201).json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('Error in createPost:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      hashtag,
      category,
      keywordId
    } = req.query;

    // Exclude posts that belong to communities
    const query = {
      $or: [{
          communityId: null
        },
        {
          communityId: {
            $exists: false
          }
        }
      ]
    };

    // Filter by hashtag if provided
    let hashtagToFilter = hashtag;

    if (keywordId) {
      const keywordDoc = await Keyword.findById(keywordId);
      if (keywordDoc) {
        hashtagToFilter = keywordDoc.word;
      }
    }

    if (hashtagToFilter) {
      const Hashtag = require('../models/Hashtag');
      const cleanHashtag = hashtagToFilter.startsWith('#') ? hashtagToFilter.slice(1).toLowerCase() : hashtagToFilter.toLowerCase();
      const hashtagDoc = await Hashtag.findOne({
        name: cleanHashtag
      });
      if (hashtagDoc) {
        query.hashtags = hashtagDoc._id;
      } else {
        // If hashtag doesn't exist, return empty results
        return res.json({
          success: true,
          data: {
            posts: [],
            hasMore: false,
          },
        });
      }
    }

    // Filter by category if provided
    if (category && category !== 'All') {
      const Category = require('../models/category');
      const categoryDoc = await Category.findOne({
        name: new RegExp(`^${category}$`, 'i')
      });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    }

    const posts = await Post.find(query)
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("categoryId", "name")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts: posts.map(formatPost),
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid Post ID format"
        });
    }

    const post = await Post.findById(req.params.id)
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("hashtags", "name")
      .populate("categoryId", "name");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Emit POST_VIEWED event for trend tracking
    const eventBus = require('../utils/eventBus');
    eventBus.emit(eventBus.EVENTS.POST_VIEWED, {
      post
    });

    post.uniqueViews += 1;
    await post.save();
    // No more AI analysis triggered here

    res.json({
      success: true,
      data: formatPost(post),
    });
  } catch (error) {
    next(error);
  }
};

exports.upvotePost = async (req, res, next) => {
  try {
    const eventBus = require('../utils/eventBus');
    const User = require('../models/user');

    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({
      message: "Post not found"
    });

    const updatedPost = await Post.findByIdAndUpdate(
        req.params.id, {
          $pull: {
            downvotes: userId
          },
          $addToSet: {
            upvotes: userId
          },
        }, {
          new: true
        }
      )
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("categoryId", "name");


    // Emit upvote event with user data for weighted trending
    const user = await User.findById(userId).select('reputationScore');
    eventBus.emit(eventBus.EVENTS.POST_UPVOTED, {
      post: updatedPost,
      user
    });

    // Update reputation after voting
    if (updatedPost.businessId) {
      await reputationService.updateBusinessMetrics(updatedPost.businessId);
    }

    // Dynamic Trend Boosting: Votes increase trend score heavily
    if (updatedPost.hashtags && updatedPost.hashtags.length > 0) {
      (async () => {
        try {
          // Determine if we need to fetch hashtag names if not populated?
          // upvotePost populates authorId and businessId. Let's populate hashtags too or fetch them.
          // Re-fetching seems safer or we can add populate to the findByIdAndUpdate above. 
          // Actually the findByIdAndUpdate above only populates author/business.
          // We'll fetch the names.
          const fullPost = await Post.findById(updatedPost._id).populate('hashtags');
          for (const tag of fullPost.hashtags) {
            // Match Trend directly via hashtagId
            await Trend.updateOne({
              hashtagId: tag._id
            }, {
              $inc: {
                score: 2.0,
                velocity: 5
              }
            }, {
              upsert: false // Don't create if doesn't exist here
            });
          }
        } catch (err) {
          console.error("Error boosting trend vote:", err);
        }
      })();
    }

    res.json({
      success: true,
      data: formatPost(updatedPost),
    });
  } catch (error) {
    next(error);
  }
};

exports.downvotePost = async (req, res, next) => {
  try {
    const eventBus = require('../utils/eventBus');
    const User = require('../models/user');

    const userId = req.user._id;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({
      message: "Post not found"
    });

    const updatedPost = await Post.findByIdAndUpdate(
        req.params.id, {
          $pull: {
            upvotes: userId
          },
          $addToSet: {
            downvotes: userId
          },
        }, {
          new: true
        }
      )
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("categoryId", "name");


    // Emit downvote event with user data for weighted trending
    const user = await User.findById(userId).select('reputationScore');
    eventBus.emit(eventBus.EVENTS.POST_DOWNVOTED, {
      post: updatedPost,
      user
    });

    // Update reputation after voting
    if (updatedPost.businessId) {
      await reputationService.updateBusinessMetrics(updatedPost.businessId);
    }

    res.json({
      success: true,
      data: formatPost(updatedPost),
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostsByBusiness = async (req, res, next) => {
  try {
    const {
      businessId
    } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
        $or: [{
          businessId: businessId
        }, {
          authorId: businessId
        }],
      })
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("categoryId", "name")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      $or: [{
        businessId: businessId
      }, {
        authorId: businessId
      }],
    });

    res.json({
      success: true,
      data: {
        posts: posts.map(formatPost),
        hasMore: skip + posts.length < total,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostsByCommunity = async (req, res, next) => {
  try {
    const {
      communityId
    } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
        communityId
      })
      .populate("authorId", "username fullName avatarUrl accountType")
      .populate("businessId", "name avatarUrl")
      .populate("categoryId", "name")
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      communityId
    });

    res.json({
      success: true,
      data: {
        posts: posts.map(formatPost),
        hasMore: skip + posts.length < total,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.votePost = async (req, res, next) => {
  try {
    const {
      type
    } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({
      message: "Post not found"
    });

    // Helper to toggle vote
    const userIdStr = userId.toString();
    const upIndex = post.upvotes.map(id => id.toString()).indexOf(userIdStr);
    const downIndex = post.downvotes.map(id => id.toString()).indexOf(userIdStr);

    if (type === "up") {
      if (downIndex > -1) post.downvotes.splice(downIndex, 1);
      if (upIndex === -1) {
        post.upvotes.push(userId);
      } else {
        // If already upvoted, maybe toggle off? Or do nothing?
        // Usually clicking active vote toggles off.
        post.upvotes.splice(upIndex, 1);
      }
    } else {
      if (upIndex > -1) post.upvotes.splice(upIndex, 1);
      if (downIndex === -1) {
        post.downvotes.push(userId);
      } else {
        post.downvotes.splice(downIndex, 1);
      }
    }

    // Update Counts
    post.upvotesCount = post.upvotes.length;
    await post.save();

    // Re-populate for response
    await post.populate("authorId", "username fullName avatarUrl accountType");
    await post.populate("businessId", "name avatarUrl");

    if (post.businessId) {
      await reputationService.updateBusinessMetrics(post.businessId);
    }

    res.json({
      success: true,
      data: formatPost(post),
    });
  } catch (error) {
    next(error);
  }
};

exports.sharePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    // Increment external clicks as a mock for "shares" for now
    post.externalClicks += 1;
    await post.save();

    // Emit POST_SHARED event for trend tracking
    const eventBus = require('../utils/eventBus');
    eventBus.emit(eventBus.EVENTS.POST_SHARED, {
      post,
      user: req.user
    });

    res.json({
      success: true,
      data: formatPost(post),
    });
  } catch (error) {
    next(error);
  }
};

exports.incrementView = async (req, res, next) => {
  try {
    const eventBus = require('../utils/eventBus');

    const post = await Post.findById(req.params.id).populate('hashtags');

    if (!post) return res.status(404).json({
      message: "Post not found"
    });

    // Emit VIEW event - subscriber will handle trend updates
    eventBus.emit(eventBus.EVENTS.POST_VIEWED, {
      post
    });

    // Dynamic Trend Boosting: Views increase trend score for keywords
    if (post.hashtags && post.hashtags.length > 0) {
      // Fire and forget (don't await to keep UI fast)
      (async () => {
        try {
          for (const tag of post.hashtags) {
            // Match Trend directly via hashtagId
            await Trend.updateOne({
              hashtagId: tag._id
            }, {
              $inc: {
                score: 0.5,
                velocity: 1
              }
            }, {
              upsert: false
            });
          }
        } catch (err) {
          console.error("Error boosting trend view:", err);
        }
      })();
    }

    // Return updated post impressions
    const updatedPost = await Post.findById(req.params.id);
    res.json({
      success: true,
      views: updatedPost ? post.impressions + 1 : post.impressions
    });
  } catch (error) {
    next(error);
  }
};