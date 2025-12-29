const mongoose = require('mongoose');

const postHashtagSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  hashtag: { type: String, required: true }
});

module.exports = mongoose.model('PostHashtag', postHashtagSchema);
