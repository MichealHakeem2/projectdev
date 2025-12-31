const mongoose = require("mongoose");

const trendSchema = new mongoose.Schema({
  keywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Keyword"
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },
  score: Number,
  velocity: Number,
  sentiment: Number,
  hypeRisk: Number,
  promotedTrendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromotedTrend"
  },
  status: {
    type: String,
    enum: ["rising", "hot", "falling"],
    default: "hot"
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Trend", trendSchema);