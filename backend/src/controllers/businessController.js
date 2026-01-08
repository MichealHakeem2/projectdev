const Business = require("../models/business");
const User = require("../models/user");

exports.createBusiness = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already has a business
    const existingBusiness = await Business.findOne({
      userId
    });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: "User already has a business profile",
      });
    }

    const {
      name,
      description,
      category,
      industry,
      type,
      website,
      companySize
    } = req.body;

    const businessData = {
      userId,
      name,
      description,
      category: category || industry, // Fallback for flexibility
      industry: industry || category,
      type: type || "company",
      website,
      companySize,
    };

    // Handle uploaded files
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        businessData.avatarUrl = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.coverImage && req.files.coverImage[0]) {
        businessData.coverUrl = `/uploads/${req.files.coverImage[0].filename}`;
      }
    }

    const business = await Business.create(businessData);

    // Update user role and businessId
    await User.findByIdAndUpdate(userId, {
      role: "business",
      accountType: "business",
      businessId: business._id,
    });

    res.status(201).json({
      success: true,
      data: formatBusiness(business),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Formats a business for the frontend.
 */
const formatBusiness = (business) => {
  if (!business) return null;
  const b = business.toObject ? business.toObject() : business;

  // Ensure 'logo' and 'coverImage' are available for frontend compatibility
  if (b.avatarUrl && !b.logo) {
    b.logo = b.avatarUrl;
  }
  if (b.coverUrl && !b.coverImage) {
    b.coverImage = b.coverUrl;
  }

  return b;
};

exports.getBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Business not found"
        });
    }
    res.status(200).json({
      success: true,
      data: formatBusiness(business)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchBusinesses = async (req, res) => {
  try {
    const {
      q,
      category
    } = req.query;
    const query = {};

    if (q) {
      query.$or = [{
          name: {
            $regex: q,
            $options: "i"
          }
        },
        {
          description: {
            $regex: q,
            $options: "i"
          }
        },
      ];
    }

    if (category && category !== "All") {
      query.industry = category;
    }

    const businesses = await Business.find(query).limit(20);
    res.status(200).json({
      success: true,
      data: businesses.map(formatBusiness)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBusinessesByCategory = async (req, res) => {
  try {
    const {
      category
    } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = category && category !== "All" ? {
      industry: category
    } : {};
    const businesses = await Business.find(query)
      .sort({
        reputationScore: -1
      })
      .skip(skip)
      .limit(limit);

    const total = await Business.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        businesses: businesses.map(formatBusiness),
        hasMore: skip + businesses.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserBusinesses = async (req, res) => {
  try {
    const {
      userId
    } = req.params;
    const businesses = await Business.find({
      userId
    });
    res.status(200).json({
      success: true,
      data: businesses.map(formatBusiness)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.followBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business)
      return res.status(404).json({
        message: "Business not found"
      });

    const userId = req.user._id;

    // Check if user already follows
    if (business.followers.includes(userId)) {
      return res
        .status(400)
        .json({
          message: "Already following this business"
        });
    }

    // Add follower
    business.followers.push(userId);
    await business.save();

    res.json({
      success: true,
      message: "Followed successfully",
      data: formatBusiness(business),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateBusinessProfile = async (req, res) => {
  try {
    const updates = req.body;

    // Handle file uploads
    if (req.files) {
      if (req.files['logo'] && req.files['logo'][0]) {
        updates.avatarUrl = `/uploads/${req.files['logo'][0].filename}`;
      }
      if (req.files['coverImage'] && req.files['coverImage'][0]) {
        updates.coverUrl = `/uploads/${req.files['coverImage'][0].filename}`;
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof updates.address === 'string') {
      try {
        updates.address = JSON.parse(updates.address);
      } catch (e) {}
    }
    if (typeof updates.socialLinks === 'string') {
      try {
        updates.socialLinks = JSON.parse(updates.socialLinks);
      } catch (e) {}
    }

    // Dynamic keyword extraction from description
    if (updates.description) {
      // Simple extraction: split, filter common words, take top 5 unique
      const words = updates.description.split(/\s+/);
      const stopWords = new Set(['the', 'and', 'or', 'a', 'an', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'is', 'are']);
      const keywords = [...new Set(words
        .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 3 && !stopWords.has(w))
      )].slice(0, 5);

      // We could update keywords here if we had a field
    }

    // Handle Hashtags (comma separated string)
    if (updates.hashtags && typeof updates.hashtags === 'string') {
      const Hashtag = require("../models/Hashtag");
      const Keyword = require("../models/Keyword"); // Keyword Integration

      const tagNames = updates.hashtags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(t => t);
      const uniqueTags = [...new Set(tagNames)];
      const hashtagIds = [];

      for (const name of uniqueTags) {
        // 1. Hashtag
        let tag = await Hashtag.findOne({
          name
        });
        if (!tag) {
          tag = await Hashtag.create({
            name,
            count: 1
          });
        } else {
          tag.count += 1;
          await tag.save();
        }
        hashtagIds.push(tag._id);

        // 2. Keyword Sync
        try {
          let keyword = await Keyword.findOne({
            word: name
          });
          if (keyword) {
            keyword.frequency += 1;
            keyword.lastUpdated = Date.now();
            await keyword.save();
          } else {
            await Keyword.create({
              word: name,
              frequency: 1,
              lastUpdated: Date.now()
            });
          }
        } catch (err) {
          console.error("Error syncing keyword in business update:", err);
        }
      }
      updates.hashtags = hashtagIds;
    }

    const business = await Business.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('hashtags', 'name');

    if (!business) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Business not found"
        });
    }
    res.status(200).json({
      success: true,
      data: formatBusiness(business)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addOffering = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category
    } = req.body;
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Business not found"
        });
    }

    business.offerings.push({
      name,
      description,
      price,
      category
    });
    await business.save();

    res.status(201).json({
      success: true,
      data: business
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeOffering = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Business not found"
        });
    }

    business.offerings = business.offerings.filter(
      (o) => o._id.toString() !== req.params.offeringId
    );
    await business.save();

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find();
    res.status(200).json({
      success: true,
      data: businesses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};