const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  avatarUrl: String,
  coverUrl: String,
  type: {
    type: String,
    enum: ["individual", "company"],
    required: true
  },
  industry: {
    type: String,
    required: true
  },

  companySize: {
    type: String,
    enum: ["startup", "shop", "small", "medium", "enterprise"],
    default: "startup"
  },

  website: String,

  verified: {
    type: Boolean,
    default: false
  },

  reputationScore: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Business", businessSchema);
