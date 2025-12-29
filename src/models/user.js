const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["guest","user","creator","business","admin"], default: "guest" },
  avatarUrl: String,
  bio: String,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
  interests: [String],
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: { createdAt: "createdAt" } });

module.exports = mongoose.model("User", userSchema);
