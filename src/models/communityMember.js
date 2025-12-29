const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
