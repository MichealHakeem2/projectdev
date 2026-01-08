const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
  },
  media: [{
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    url: String,
  }, ],
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
}, {
  timestamps: true
});

communityMessageSchema.index({
  communityId: 1,
  createdAt: -1
});

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);