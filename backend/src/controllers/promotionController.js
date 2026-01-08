const mongoose = require("mongoose");
const Post = require("../models/post");
const Category = require("../models/category");
const Promotion = require("../models/promotion");
const PromotedTrend = require('../models/promotedTrend');
const Trend = require('../models/trend');

exports.createPromotion = async (req, res) => {
  try {
    const {
      postId,
      budget,
      duration,
      targetRegion,
      targetCategory
    } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration));

    let resolvedCategory = targetCategory;
    if (targetCategory && !mongoose.Types.ObjectId.isValid(targetCategory)) {
      const category = await Category.findOne({
        name: new RegExp('^' + targetCategory + '$', 'i')
      });
      if (category) {
        resolvedCategory = category._id;
      } else {
        // If not found, maybe ignore or create? For now let's just set to null if invalid
        resolvedCategory = null;
      }
    }

    const promotion = await Promotion.create({
      postId,
      businessId: req.user.businessId || req.user._id,
      budget,
      duration,
      endDate,
      targetRegion,
      targetCategory: resolvedCategory,
      status: 'active'
    });

    // Mark post as promoted
    post.isPromoted = true;
    await post.save();

    // Initialize/Update trend status to ensure it appears in trending feed immediately
    const {
      updatePostTrendStatus
    } = require("../utils/trendUtils");
    await updatePostTrendStatus(postId, 0);

    res.status(201).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : {
      businessId: req.user.businessId || req.user._id
    };
    const promotions = await Promotion.find(query).populate('postId');
    res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate('postId');
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }
    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPromotionAnalytics = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    // Generate mock analytics data based on history for demonstration
    const analytics = {
      impressions: promotion.analytics.impressions || Math.floor(promotion.spent * 150),
      clicks: promotion.analytics.clicks || Math.floor(promotion.spent * 12),
      ctr: ((promotion.analytics.clicks || 1) / (promotion.analytics.impressions || 1) * 100).toFixed(2),
      conversions: promotion.analytics.conversions || Math.floor(promotion.spent * 2),
      spent: promotion.spent,
      remaining: promotion.budget - promotion.spent,
      roi: (Math.random() * 2 + 2).toFixed(1) // Random ROI between 2x and 4x
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.pausePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id, {
        status: 'paused'
      }, {
        new: true
      }
    );
    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.resumePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id, {
        status: 'active'
      }, {
        new: true
      }
    );
    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// --- Promoted Trend Logic ---

exports.createTrendPromotion = async (req, res, next) => {
  try {
    const {
      trendId,
      tag, // New: allow passing a tag string directly
      businessId,
      adPackage,
      price,
      targetRegion,
      startAt,
      endAt
    } = req.body;

    let resolvedTrendId = trendId;

    // If a tag is provided instead of trendId, find or create the Keyword and Trend
    if (!resolvedTrendId && tag) {
      const Keyword = require('../models/keyword');
      const Trend = require('../models/trend');

      const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;

      // 1. Find or create Hashtag
      let hashtag = await Hashtag.findOne({
        name: new RegExp(`^${cleanTag}$`, 'i')
      });
      if (!hashtag) {
        hashtag = await Hashtag.create({
          name: cleanTag.toLowerCase(),
          count: 0,
          posts: []
        });
      }

      // 2. Find or create Trend
      let trend = await Trend.findOne({
        hashtagId: hashtag._id
      });
      if (!trend) {
        trend = await Trend.create({
          hashtagId: hashtag._id,
          score: (price || 0) / 10,
          status: 'rising',
          detectedAt: new Date(),
          sourceType: 'promoted'
        });
      }
      resolvedTrendId = trend._id;
    }

    const promotion = await PromotedTrend.create({
      trendId: resolvedTrendId,
      businessId,
      adPackage,
      price: price || 0,
      targetRegion,
      startAt: startAt || new Date(),
      endAt,
      active: true
    });

    if (resolvedTrendId) {
      await Trend.findByIdAndUpdate(resolvedTrendId, {
        promotedTrendId: promotion._id,
        sourceType: 'promoted',
        score: (price || 0) / 10
      });
    }

    res.status(201).json({
      success: true,
      promotion
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveTrendPromotions = async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await PromotedTrend.find({
      active: true,
      startAt: {
        $lte: now
      },
      endAt: {
        $gte: now
      }
    }).populate('businessId', 'name avatarUrl');

    res.json({
      success: true,
      promotions
    });
  } catch (error) {
    next(error);
  }
};

exports.stopTrendPromotion = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const promotion = await PromotedTrend.findByIdAndUpdate(id, {
      active: false
    }, {
      new: true
    });
    res.json({
      success: true,
      promotion
    });
  } catch (error) {
    next(error);
  }
};