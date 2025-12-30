const Message = require('../models/Message');

exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{
                sender: req.user._id,
                receiver: req.params.friendId
            }, {
                sender: req.params.friendId,
                receiver: req.user._id
            }]
        }).sort({
            createdAt: 1
        });
        res.json(messages);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.uploadFile = async (req, res) => {
    console.log('Upload Request Received:', req.file ? req.file.originalname : 'No File');
    try {
        if (!req.file) return res.status(400).json({
            error: 'No file uploaded'
        });

        const fileUrl = `/uploads/${req.file.filename}`;
        console.log('File Saved:', fileUrl);
        res.json({
            fileUrl,
            fileName: req.file.originalname,
            fileType: req.file.mimetype
        });
    } catch (err) {
        console.error('Upload Controller Error:', err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const {
            messageId
        } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                error: 'Message not found'
            });
        }

        // Only the sender can delete their message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: 'You can only delete your own messages'
            });
        }

        await Message.findByIdAndDelete(messageId);

        res.json({
            message: 'Message deleted successfully',
            messageId
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};