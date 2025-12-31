const User = require('../models/user');
const Post = require('../models/post');
const UserBadge = require('../models/userbadge');
const Badge = require('../models/badge');
const bcrypt = require('bcryptjs');

// Helper to populate user data (e.g. Badges)
const populateUserData = async (user) => {
    const userBadges = await UserBadge.find({
        userId: user._id
    }).populate('badgeId');
    const badges = userBadges.map(ub => ({
        ...ub.badgeId.toObject(),
        earnedAt: ub.earnedAt
    }));
    return {
        ...user.toObject(),
        badges
    };
};

exports.getProfile = async (req, res, next) => {
    try {
        const userData = await populateUserData(req.user);
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({
            message: 'User not found'
        });

        const userData = await populateUserData(user);
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        const updates = req.body;
        // Protected fields
        ['role', 'password', 'reputationScore', 'isVerified', 'aiTrustScore', 'botProbability', 'followers', 'following'].forEach(f => delete updates[f]);

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.password) return res.status(400).json({
            message: 'External auth user'
        });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({
            message: 'Incorrect password'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({
            success: true,
            message: 'Password updated'
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserFeed = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        // Global Feed (Global Timeline) - No following logic
        const feed = await Post.find()
            .populate('authorId', 'fullName avatarUrl')
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            feed,
            page,
            hasMore: feed.length === limit
        });
    } catch (error) {
        next(error);
    }
};

exports.assignBadgeToUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({
            message: 'Admin only'
        });
        const {
            badgeId
        } = req.body;
        const userId = req.params.id;

        const exists = await UserBadge.findOne({
            userId,
            badgeId
        });
        if (exists) return res.status(400).json({
            message: 'Badge already assigned'
        });

        const ub = await UserBadge.create({
            userId,
            badgeId,
            earnedAt: new Date()
        });
        res.json({
            success: true,
            userBadge: ub
        });
    } catch (error) {
        next(error);
    }
};