const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema({
  targetType: { type: String, enum: ["post","comment"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sentiment: Number,
  keywords: [String],
  authenticity: { type: Number, default: 1 },
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
