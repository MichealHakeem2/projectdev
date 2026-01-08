const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business"
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community"
  },

  content: {
    type: String,
    required: true
  },
  media: [{
    type: {
      type: String,
      enum: ["image", "video"],
      required: true
    },
    url: {
      type: String,
      required: true
    },
  }, ],
  // Keep mediaUrl for backward compatibility if needed, but we'll use media array
  mediaUrl: String,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  hashtags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hashtag"
  }],
  tag: {
    type: String
  },

  // Engagement
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  upvotesCount: {
    type: Number,
    default: 0
  }, // Added for sorting
  commentsCount: {
    type: Number,
    default: 0
  },

  // Impressions & shares
  impressions: {
    type: Number,
    default: 0
  },
  uniqueViews: {
    type: Number,
    default: 0
  },
  externalClicks: {
    type: Number,
    default: 0
  }, // link shares
}, {
  timestamps: true
});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);