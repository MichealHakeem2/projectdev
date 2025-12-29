const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },

  content: { type: String, required: true },
  mediaUrl: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  hashtags: [String],

  // Engagement
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },

  // Impressions & shares
  impressions: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  externalClicks: { type: Number, default: 0 }, // link shares

  // Ad & boost
  adBoost: { type: Number, default: 1 },
  lastBoostedAt: Date,
  isAd: { type: Boolean, default: false },
  adPackage: { type: String, enum: ["none", "starter", "boost", "viral"], default: "none" },

  // AI scores
  sentimentScore: { type: Number, default: 0 },
  authenticityScore: { type: Number, default: 1 },
  trendScore: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
