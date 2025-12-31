const User = require("../models/user");
const Otp = require("../models/otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendEmail,
  generateOTP
} = require("../utils/emailService");
const {
  updateUserReputation
} = require("../utils/trendUtils");

const generateToken = (id, role) => {
  return jwt.sign({
    id,
    role
  }, process.env.JWT_SECRET, {
    expiresIn: '2h'
  });
};

exports.login = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user = await User.findOne({
      email
    });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password
    } = req.body;

    const existingUser = await User.findOne({
      email
    });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.createGuestUser = async (req, res, next) => {
  try {
    const guest = await User.create({
      fullName: 'Guest User',
      email: `guest_${Date.now()}@trendverse.com`,
      password: await bcrypt.hash(`guest_${Date.now()}`, 10),
      role: 'guest',
    });

    const token = generateToken(guest._id, guest.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: guest._id,
        role: 'guest'
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

exports.sendVerificationCode = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({
      message: "User not found"
    });
    if (user.isVerified) return res.status(400).json({
      message: "Already verified"
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    await Otp.deleteMany({
      email: user.email,
      type: 'verification'
    });

    await Otp.create({
      email: user.email,
      code: hashedCode,
      type: 'verification',
      expiresAt
    });

    await sendEmail(user.email, "Verify Account - Trendverse", `Your verification code is: <b>${code}</b>. It expires in 5 minutes.`);

    res.json({
      success: true,
      message: "Verification code sent"
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      code
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({
      message: "User not found"
    });
    if (user.isVerified) return res.status(400).json({
      message: "Already verified"
    });

    const otpRecord = await Otp.findOne({
      email: user.email,
      type: 'verification'
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired code"
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({
        _id: otpRecord._id
      });
      return res.status(400).json({
        message: "Code expired"
      });
    }

    const isMatch = await bcrypt.compare(code, otpRecord.code);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid code"
      });
    }

    user.isVerified = true;
    await user.save();

    await Otp.deleteMany({
      email: user.email
    });

    const eventBus = require('../utils/eventBus');
    eventBus.emit(eventBus.EVENTS.USER_VERIFIED, {
      user
    });

    res.json({
      success: true,
      message: "Email verified successfully",
      reputationScore: user.reputationScore
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const {
      email
    } = req.body;
    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, 10);

    await Otp.deleteMany({
      email: user.email,
      type: 'reset'
    });

    await Otp.create({
      email: user.email,
      code: hashedCode,
      type: 'reset',
      expiresAt
    });

    await sendEmail(user.email, "Reset Password - Trendverse", `Your password reset code is: <b>${code}</b>. Valid for 5 minutes.`);

    res.json({
      success: true,
      message: "Reset code sent"
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const {
      email,
      code,
      newPassword
    } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      type: 'reset'
    });

    if (!otpRecord) return res.status(400).json({
      message: "Invalid or expired code"
    });

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({
        _id: otpRecord._id
      });
      return res.status(400).json({
        message: "Code expired"
      });
    }

    const isMatch = await bcrypt.compare(code, otpRecord.code);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid code"
      });
    }

    const user = await User.findOne({
      email
    });
    if (!user) return res.status(404).json({
      message: "User not found"
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Otp.deleteMany({
      email
    });

    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    next(error);
  }
};