const Post = require('../models/post');
const Trend = require('../models/trend');
const User = require('../models/user');
const PromotedTrend = require('../models/promotedTrend');
const eventBus = require('./eventBus');

const getUserPower = (reputationScore = 0) => {
    return Math.log10(Math.max(0, reputationScore) + 10);
};

const calculateInteractionImpressions = (action, reputationScore) => {
    const power = getUserPower(reputationScore);

    switch (action) {
        case 'VIEW':
            return 1;
        case 'UPVOTE':
            return 2 * power;
        case 'COMMENT':
            return 3 * power;
        case 'SHARE':
            return 5 * power;
        case 'DOWNVOTE':
            return -2 * power;
        default:
            return 0;
    }
};

const updatePostTrendStatus = async (postId, impressionChange = 0) => {
    try {
        const post = await Post.findById(postId);
        if (!post) return;

        post.impressions = Math.max(0, (post.impressions || 0) + impressionChange);

        let trend = await Trend.findOne({
            postId: post._id
        });
        const now = new Date();

        if (!trend) {
            trend = await Trend.create({
                postId: post._id,
                status: 'rising',
                detectedAt: now,
                lastUpdated: now,
                velocity: 0,
                score: 0
            });
        }

        const timeDeltaHours = Math.max(0.01, (now - trend.lastUpdated) / (1000 * 60 * 60));
        const currentVelocity = impressionChange;
        trend.velocity = (trend.velocity * 0.8) + (currentVelocity * 0.2);

        const logImp = Math.log10(post.impressions + 1);
        const sentimentMultiplier = (1 + (post.sentimentScore || 0));
        const authMultiplier = post.authenticityScore || 1;

        let finalScore = logImp * trend.velocity * sentimentMultiplier * authMultiplier;

        if (trend.promotedTrendId) {
            const promotion = await PromotedTrend.findOne({
                _id: trend.promotedTrendId,
                active: true,
                endAt: {
                    $gt: new Date()
                }
            });

            if (promotion) {
                let multiplier = 1;
                switch (promotion.adPackage) {
                    case 'starter':
                        multiplier = 1.5;
                        break;
                    case 'boost':
                        multiplier = 2.0;
                        break;
                    case 'viral':
                        multiplier = 3.0;
                        break;
                }
                finalScore *= multiplier;
            }
        }

        let status = 'falling';
        if (trend.velocity > 5) status = 'hot';
        else if (trend.velocity >= 1) status = 'rising';

        trend.score = finalScore;
        trend.status = status;
        trend.lastUpdated = now;
        await trend.save();

        post.trendScore = finalScore;
        post.isTrending = finalScore > 10;
        await post.save();

        if (status === 'hot') {
            eventBus.emit(eventBus.EVENTS.POST_TRENDING, {
                post,
                trend
            });
        }

    } catch (error) {
        console.error("Error updating trend metrics:", error);
    }
};

const updateUserReputation = async (userId, action, context = {}) => {
    try {
        let points = 0;
        const {
            voterReputation
        } = context;

        switch (action) {
            case 'EMAIL_VERIFIED':
                points = 10;
                break;
            case 'POST_CREATED':
                points = 1;
                break;
            case 'COMMENT_CREATED':
                points = 0.5;
                break;
            case 'POST_UPVOTED_BY_OTHERS':
                const power = getUserPower(voterReputation || 0);
                points = 0.2 * power;
                break;
            case 'POST_TRENDING':
                points = 20;
                break;
            case 'BUSINESS_VERIFIED':
                points = 100;
                break;
            case 'SPAM_DETECTED':
                points = -50;
                break;
            case 'HYPE_DETECTED':
                points = -100;
                break;
            case 'POST_DOWNVOTED':
                points = -0.1;
                break;
            default:
                points = 0;
        }

        if (points === 0) return;

        const user = await User.findByIdAndUpdate(userId, {
            $inc: {
                reputationScore: points
            }
        }, {
            new: true
        });

        eventBus.emit(eventBus.EVENTS.REPUTATION_CHANGE, {
            user,
            change: points,
            reason: action
        });

    } catch (err) {
        console.error('Error updating reputation:', err);
    }
};

module.exports = {
    getUserPower,
    calculateInteractionImpressions,
    updatePostTrendStatus,
    updateUserReputation
};