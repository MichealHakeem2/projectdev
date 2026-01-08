const Post = require('../models/post');
const Trend = require('../models/trend');
const User = require('../models/user');
const Keyword = require('../models/keyword');
const eventBus = require('./eventBus');

/**
 * Calculate user power based on reputation score
 * Higher reputation = more influence on trending
 */
const getUserPower = (reputationScore = 0) => {
    return Math.log10(Math.max(0, reputationScore) + 10);
};

/**
 * Calculate weighted impressions based on action type and user reputation
 */
const calculateInteractionImpressions = (action, reputationScore = 0) => {
    const power = getUserPower(reputationScore);

    switch (action) {
        case 'VIEW':
            return 1; // Simple view = 1 impression
        case 'UPVOTE':
            return 2 * power; // Upvote weighted by user reputation
        case 'COMMENT':
            return 3 * power; // Comments are valuable engagement
        case 'SHARE':
            return 5 * power; // Shares are most valuable
        case 'DOWNVOTE':
            return -2 * power; // Negative impact
        default:
            return 0;
    }
};

/**
 * Update post trend status based on impressions
 * Formula: trendScore = impressions / 1000
 */
const updatePostTrendStatus = async (postId, impressionChange = 0) => {
    try {
        const post = await Post.findById(postId);
        if (!post) return;

        // Update impressions (weighted)
        post.impressions = Math.max(0, (post.impressions || 0) + impressionChange);

        // Find or create trend record
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

        // Calculate velocity (rate of change)
        const currentVelocity = impressionChange;
        trend.velocity = (trend.velocity * 0.8) + (currentVelocity * 0.2);

        // Calculate final score: impressions / 1000
        let finalScore = post.impressions / 1000;

        // Check for promotion boost
        let isPromoted = false;
        if (trend.promotedTrendId) {
            const PromotedTrend = require('../models/promotedTrend');
            const promotion = await PromotedTrend.findOne({
                _id: trend.promotedTrendId,
                active: true,
                endAt: {
                    $gt: new Date()
                }
            });

            if (promotion) {
                isPromoted = true;
                // User requirement: score = price / 10
                finalScore = (promotion.price / 10) + (post.impressions / 1000);
            }
        } else if (post.isPromoted) {
            // Standard post promotion
            const Promotion = require('../models/promotion');
            const promotion = await Promotion.findOne({
                postId: post._id,
                status: 'active',
                endDate: {
                    $gt: new Date()
                }
            });

            if (promotion) {
                isPromoted = true;
                // Apply same price/10 logic for standard promotions too
                finalScore = (promotion.budget / 10) + (post.impressions / 1000);
            }
        }

        // Determine status based on velocity
        let status = 'falling';
        if (trend.velocity > 5) status = 'hot';
        else if (trend.velocity >= 1) status = 'rising';

        // Update trend
        trend.score = finalScore;
        trend.status = status;
        trend.sourceType = isPromoted ? 'promoted' : 'organic'; // Ensure sourceType is set
        trend.lastUpdated = now;
        await trend.save();

        // Update post
        post.trendScore = finalScore;
        post.isTrending = isPromoted || finalScore >= 5; // Promoted posts are always "trending"
        await post.save();

        // Emit event if post becomes hot
        if (status === 'hot') {
            eventBus.emit(eventBus.EVENTS.POST_TRENDING, {
                post,
                trend
            });
        }

        // BOOST HASHTAGS: Update trend records for all hashtags in this post
        if (post.hashtags && post.hashtags.length > 0) {
            // Find hashtags and their names
            const populatedPost = await Post.findById(post._id).populate('hashtags');
            if (populatedPost && populatedPost.hashtags) {
                for (const h of populatedPost.hashtags) {
                    // 1. Find or create Keyword for this hashtag name
                    let keyword = await Keyword.findOne({
                        word: new RegExp(`^${h.name}$`, 'i')
                    });
                    if (!keyword) {
                        keyword = await Keyword.create({
                            word: h.name.toLowerCase(),
                            category: populatedPost.categoryId ? 'Topic' : 'General',
                            relevanceScore: 1
                        });
                    }

                    // 2. Find or create Trend record for this Hashtag
                    let keywordTrend = await Trend.findOne({
                        hashtagId: h._id
                    });
                    if (!keywordTrend) {
                        keywordTrend = await Trend.create({
                            hashtagId: h._id,
                            postId: post._id, // Link to this post as a representative
                            status: 'rising',
                            detectedAt: now,
                            lastUpdated: now,
                            velocity: 0,
                            score: 0
                        });
                    }

                    // 3. Boost score based on post's engagement
                    // Hashtag gets 1/5th of the post's impression impact as a baseline
                    const hashtagBoost = impressionChange / 5;
                    keywordTrend.velocity = (keywordTrend.velocity * 0.8) + (hashtagBoost * 0.2);
                    keywordTrend.score = (keywordTrend.score || 0) + (hashtagBoost / 100); // Gradual climb
                    keywordTrend.lastUpdated = now;
                    await keywordTrend.save();
                }
            }
        }

    } catch (error) {
        console.error("Error updating trend metrics:", error);
    }
};

/**
 * Update user reputation based on actions
 */
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
            case 'POST_DOWNVOTED':
                points = -0.1;
                break;
            default:
                points = 0;
        }

        if (points === 0) return;

        const user = await User.findByIdAndUpdate(
            userId, {
                $inc: {
                    reputationScore: points
                }
            }, {
                new: true
            }
        );

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