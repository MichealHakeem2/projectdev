const Trend = require('../models/trend');
const Keyword = require('../models/keyword');

exports.getGlobalTrends = async (req, res, next) => {
    try {
        const {
            status,
            limit
        } = req.query;
        const query = {};
        if (status) query.status = status;

        const trends = await Trend.find(query)
            .populate('keywordId')
            .populate('postId') // Top post associated
            .sort({
                score: -1
            })
            .limit(parseInt(limit) || 10);

        res.json({
            success: true,
            trends
        });
    } catch (error) {
        next(error);
    }
};

exports.getTrendById = async (req, res, next) => {
    try {
        const trend = await Trend.findById(req.params.id)
            .populate('keywordId')
            .populate('postId');

        if (!trend) return res.status(404).json({
            message: 'Trend not found'
        });

        res.json({
            success: true,
            trend
        });
    } catch (error) {
        next(error);
    }
};

// System / Admin function to calculate or update trends
exports.updateTrendStatus = async (req, res, next) => {
    try {
        // Typically restricted
        // if (req.user.role !== 'admin') ... 

        const {
            id
        } = req.params;
        const {
            status,
            score,
            velocity
        } = req.body;

        const trend = await Trend.findByIdAndUpdate(id, {
            status,
            score,
            velocity,
            lastUpdated: new Date()
        }, {
            new: true
        });

        if (!trend) return res.status(404).json({
            message: 'Trend not found'
        });

        res.json({
            success: true,
            trend
        });
    } catch (error) {
        next(error);
    }
};