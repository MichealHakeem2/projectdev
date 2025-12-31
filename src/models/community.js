const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  avatarUrl: String,
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: { createdAt: "createdAt" } });

module.exports = mongoose.model('Community', communitySchema);
