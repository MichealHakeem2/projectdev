const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["guest", "user", "creator", "business", "admin"],
    default: "guest"
  },
  accountType: {
    type: String,
    enum: ["personal", "business"],
    default: "personal"
  },
  avatarUrl: String,
  bio: String,
  location: String,
  website: String,
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business"
  },
  interests: [String],
  followers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    default: []
  },
  following: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    default: []
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Badge"
  }],
  reputationScore: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: {
    createdAt: "createdAt"
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await require('bcryptjs').compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);