const CommunityMessage = require('../models/communitymessage');
const CommunityMember = require('../models/communityMember');
const {
    emitToCommunity
} = require('../services/socketService');

exports.sendCommunityMessage = async (req, res, next) => {
    try {
        const {
            communityId
        } = req.params;
        const {
            content
        } = req.body;
        const userId = req.user._id || req.user.id;

        const membership = await CommunityMember.findOne({
            communityId,
            userId
        });

        if (!membership) {
            return res.status(403).json({
                message: 'You are not a member of this community'
            });
        }

        const message = await CommunityMessage.create({
            communityId,
            userId,
            content,
            isRead: false
        });

        const populatedMessage = await CommunityMessage.findById(message._id)
            .populate('userId', 'fullName avatarUrl');

        emitToCommunity(communityId, 'new_community_message', {
            id: message._id,
            communityId,
            sender: {
                id: userId,
                fullName: req.user.fullName,
                avatarUrl: req.user.avatarUrl
            },
            content,
            timestamp: message.createdAt
        });

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        next(error);
    }
};

exports.getCommunityMessages = async (req, res, next) => {
    try {
        const {
            communityId
        } = req.params;
        const userId = req.user._id || req.user.id;
        const {
            limit = 50, skip = 0
        } = req.pagination || {};

        const membership = await CommunityMember.findOne({
            communityId,
            userId
        });

        if (!membership) {
            return res.status(403).json({
                message: 'You are not a member of this community'
            });
        }

        const messages = await CommunityMessage.find({
                communityId
            })
            .populate('userId', 'fullName avatarUrl')
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            messages: messages.reverse()
        });
    } catch (error) {
        next(error);
    }
};

exports.markMessageRead = async (req, res, next) => {
    try {
        const {
            messageId
        } = req.params;
        const userId = req.user._id || req.user.id;

        const message = await CommunityMessage.findByIdAndUpdate(
            messageId, {
                isRead: true
            }, {
                new: true
            }
        );

        if (!message) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message
        });
    } catch (error) {
        next(error);
    }
};