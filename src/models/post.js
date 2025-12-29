const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  mediaUrl: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  hashtags: [String],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sentimentScore: { type: Number, default: 0 },
  authenticityScore: { type: Number, default: 1 },
  trendScore: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
}, { timestamps: { createdAt: "createdAt" } });

module.exports = mongoose.model("Post", postSchema);
