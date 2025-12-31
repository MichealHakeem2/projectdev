const Message = require('../models/message');
const User = require('../models/user');
const {
    emitToUser
} = require('../services/socketService');

exports.sendMessage = async (req, res, next) => {
    try {
        const {
            receiverId,
            content,
            mediaUrl
        } = req.body;
        const senderId = req.user._id || req.user.id;

        const message = await Message.create({
            senderId,
            receiverId,
            content,
            mediaUrl,
            isRead: false
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'fullName avatarUrl')
            .populate('receiverId', 'fullName avatarUrl');

        emitToUser(receiverId, 'new_message', {
            id: message._id,
            sender: {
                id: senderId,
                fullName: req.user.fullName,
                avatarUrl: req.user.avatarUrl
            },
            content,
            mediaUrl,
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

exports.getChatHistory = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            friendId
        } = req.params;
        const {
            limit = 50, skip = 0
        } = req.pagination || {};

        const messages = await Message.find({
                $or: [{
                        senderId: userId,
                        receiverId: friendId
                    },
                    {
                        senderId: friendId,
                        receiverId: userId
                    }
                ]
            })
            .populate('senderId', 'fullName avatarUrl')
            .populate('receiverId', 'fullName avatarUrl')
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

exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            senderId
        } = req.body;

        await Message.updateMany({
            senderId,
            receiverId: userId,
            isRead: false
        }, {
            isRead: true
        });

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteMessage = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            messageId
        } = req.params;

        const message = await Message.findOne({
            _id: messageId,
            senderId: userId
        });

        if (!message) {
            return res.status(404).json({
                message: 'Message not found or unauthorized'
            });
        }

        await message.deleteOne();

        res.json({
            success: true,
            message: 'Message deleted'
        });
    } catch (error) {
        next(error);
    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            fileUrl
        });
    } catch (error) {
        next(error);
    }
};