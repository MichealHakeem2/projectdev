const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["original", "promoted", "ai-generated", "hype"],
    default: "original"
  },
  sentimentScore: {
    type: Number,
    default: 0
  },
  authenticityScore: {
    type: Number,
    default: 1
  },
}, {
  timestamps: {
    createdAt: "createdAt"
  }
});

module.exports = mongoose.model("Comment", commentSchema);