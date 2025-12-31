const AIAnalysis = require('../models/aianalysis');
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const Trend = require('../models/trend');

exports.getAnalysisForTarget = async (req, res, next) => {
    try {
        const {
            targetId,
            targetType
        } = req.params;

        const analysis = await AIAnalysis.findOne({
            targetId,
            targetType
        }).sort({
            processedAt: -1
        });

        if (!analysis) {
            return res.status(404).json({
                message: 'Analysis not found'
            });
        }

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        next(error);
    }
};

exports.runAnalysis = async (req, res, next) => {
    try {
        const {
            targetId,
            targetType
        } = req.body;

        let existingTarget;
        if (targetType === 'post') existingTarget = await Post.findById(targetId);
        else if (targetType === 'comment') existingTarget = await Comment.findById(targetId);

        if (!existingTarget) {
            return res.status(404).json({
                message: 'Target not found'
            });
        }

        // Mock AI Logic / Placeholder (In production this calls Python Service)
        const analysis = await AIAnalysis.create({
            targetType,
            targetId,
            sentiment: Math.random() * 2 - 1, // -1 to 1
            authenticity: Math.random() * 0.5 + 0.5, // 0.5 to 1
            hypeScore: Math.random() * 10,
            keywords: ['trending', 'tech', 'viral', 'ai'],
            processedAt: new Date()
        });

        if (targetType === 'post') {
            existingTarget.sentimentScore = analysis.sentiment;
            existingTarget.authenticityScore = analysis.authenticity;
            await existingTarget.save();
        }

        res.json({
            success: true,
            message: 'Analysis completed',
            analysis
        });
    } catch (error) {
        next(error);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        // Parallel queries for performance
        const [
            userCount,
            postCount,
            commentCount,
            activeTrendsCount,
            aiStats
        ] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments(),
            Trend.countDocuments({
                status: 'active'
            }),
            AIAnalysis.aggregate([{
                $group: {
                    _id: "$targetType",
                    avgSentiment: {
                        $avg: "$sentiment"
                    },
                    avgAuthenticity: {
                        $avg: "$authenticity"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }])
        ]);

        res.json({
            success: true,
            stats: {
                users: userCount,
                posts: postCount,
                comments: commentCount,
                activeTrends: activeTrendsCount,
                aiAnalysis: aiStats
            },
            timestamp: new Date()
        });
    } catch (error) {
        next(error);
    }
};