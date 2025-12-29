const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: function() { return !this.fileUrl; } },
  fileUrl: String,
  fileName: String,
  fileType: String,
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);