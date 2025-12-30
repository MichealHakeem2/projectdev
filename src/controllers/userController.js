const User = require('../models/user');
const Post = require('../models/Post'); 

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('badges');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const updates = req.body;
       
        delete updates.role;
        delete updates.password;

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Cannot change password for guest' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.assignBadgeToUser = async (req, res, next) => {
    try {
        const { badgeId } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.badges.includes(badgeId)) {
            user.badges.push(badgeId);
            await user.save();
        }

        res.json({
            success: true,
            message: 'Badge assigned',
            badges: user.badges,
        });
    } catch (error) {
        next(error);
    }
};


exports.getUserFeed = async (req, res, next) => {
    try {
        const user = req.user;

        
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

      
        const trending = await Post.find()
            .sort({ upvotes: -1, createdAt: -1 })
            .limit(5);

       
        const interestPosts = user.interests?.length
            ? await Post.find({ keywords: { $in: user.interests } })
                .sort({ createdAt: -1 })
                .limit(10)
            : [];

       
        const allPosts = [...trending, ...interestPosts];
        const uniquePostIds = [...new Set(allPosts.map(p => p._id.toString()))];
        const feedIds = uniquePostIds.map(id => require('mongoose').Types.ObjectId(id));

        
        const feed = await Post.find({ _id: { $in: feedIds } })
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            feed,
            page,
            hasMore: feed.length === limit,
        });
    } catch (error) {
        next(error);
    }
};