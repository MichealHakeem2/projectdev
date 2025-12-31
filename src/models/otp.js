const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["verification", "reset"],
        default: "verification"
    },
    expiresAt: {
        type: Date,
        required: true,
        index: {
            expires: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Otp", otpSchema);