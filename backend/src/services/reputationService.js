const Business = require('../models/business');
const Post = require('../models/Post');

/**
 * Recalculates business reputation metrics based on activity and AI feedback.
 */
const updateBusinessMetrics = async (businessId) => {
    try {
        const business = await Business.findById(businessId);
        if (!business) return;

        // Fetch recent posts and interactions
        const posts = await Post.find({
            businessId
        }).sort({
            createdAt: -1
        }).limit(50);

        if (posts.length === 0) return;

        // 1. Engagement Rate Calculation
        const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);
        const totalEngagements = posts.reduce((sum, p) => sum + (p.upvotes ? p.upvotes.length : 0) + (p.commentsCount || 0), 0);
        const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

        // 2. Trust Score (Based on engagement)
        const trustScore = Math.min(100, (engagementRate * 5) + 50);

        // Update business
        business.metrics = {
            trustScore: Math.round(trustScore),
            innovationScore: 0,
            engagementRate: parseFloat(engagementRate.toFixed(2))
        };

        // Final Reputation Score (weighted average)
        business.reputationScore = Math.round(
            (business.metrics.trustScore * 0.6) +
            (Math.min(100, business.metrics.engagementRate * 10) * 0.4)
        );

        await business.save();
        return business;
    } catch (error) {
        console.error('Failed to update business metrics:', error);
    }
};

module.exports = {
    updateBusinessMetrics
};