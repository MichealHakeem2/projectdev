const mongoose = require("mongoose");

const trendSchema = new mongoose.Schema({
  keywordId: { type: mongoose.Schema.Types.ObjectId, ref: "Keyword", required: true },
  score: Number,
  velocity: Number,
  sentiment: Number,
  hypeRisk: Number,
  sourceType: { type: String, enum: ["organic","promoted","bot"], default: "organic" },
  promotedTrendId: { type: mongoose.Schema.Types.ObjectId, ref: "PromotedTrend" },
  status: { type: String, enum: ["rising","hot","falling"], default: "rising" },
  detectedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Trend", trendSchema);
