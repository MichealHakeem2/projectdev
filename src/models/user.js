const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["guest","user","creator","business","admin"], default: "guest" },
  avatarUrl: String,
  bio: String,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  interests: [String],
  reputationScore: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  aiTrustScore: { type: Number, default: 1 },
  botProbability: { type: Number, default: 0 },
}, { timestamps: { createdAt: "createdAt" } });

module.exports = mongoose.model("User", userSchema);
