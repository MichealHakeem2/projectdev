const Notification = require('../models/notification');

exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;

        const notifications = await Notification.find({
                userId
            })
            .sort({
                createdAt: -1
            })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            id
        } = req.params;

        // Mark specific or all? params.id 'all' common pattern, or just specific ID.
        if (id === 'all') {
            await Notification.updateMany({
                userId,
                isRead: false
            }, {
                isRead: true
            });
            return res.json({
                success: true,
                message: 'All marked as read'
            });
        }

        const notification = await Notification.findOneAndUpdate({
            _id: id,
            userId
        }, {
            isRead: true
        }, {
            new: true
        });

        if (!notification) return res.status(404).json({
            message: 'Notification not found'
        });
        res.json({
            success: true,
            notification
        });
    } catch (error) {
        next(error);
    }
};

exports.createNotification = async (req, res, next) => {
    // Usually internal usage, but maybe exposed for admin/system triggers
    try {
        const {
            userId,
            type,
            referenceId,
            message
        } = req.body; // message isn't in ERD but good to have? ERD says 'type', 'referenceId'.

        const notification = await Notification.create({
            userId,
            type,
            referenceId,
            isRead: false
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('notification', notification);
        }

        res.status(201).json({
            success: true,
            notification
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        await Notification.findOneAndDelete({
            _id: req.params.id,
            userId
        });
        res.json({
            success: true,
            message: 'Deleted'
        });
    } catch (error) {
        next(error);
    }
};