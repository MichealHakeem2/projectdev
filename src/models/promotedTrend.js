const mongoose = require("mongoose");

const promotedTrendSchema = new mongoose.Schema({
  trendId: { type: mongoose.Schema.Types.ObjectId, ref: "Trend", required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  price: { type: Number, required: true },
  targetRegion: { type: String, default: "global" }, // e.g., country, city, or global
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("PromotedTrend", promotedTrendSchema);
