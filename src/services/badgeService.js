const UserBadge = require('../models/userbadge');
const Badge = require('../models/badge');
const User = require('../models/user');
const Post = require('../models/post');
const eventBus = require('../utils/eventBus');

exports.checkAndAssignBadges = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const badges = await Badge.find();

        const existingBadges = await UserBadge.find({
            userId
        });
        const existingBadgeIds = new Set(existingBadges.map(ub => ub.badgeId.toString()));

        for (const badge of badges) {
            if (existingBadgeIds.has(badge._id.toString())) continue;

            const rule = badge.ruleKey;
            let earned = false;

            switch (rule) {
                case 'FIRST_POST':
                    const postCount = await Post.countDocuments({
                        authorId: userId
                    });
                    if (postCount >= 1) earned = true;
                    break;
                case 'TRENDSETTER':
                    const trendingCount = await Post.countDocuments({
                        authorId: userId,
                        isTrending: true
                    });
                    if (trendingCount >= 1) earned = true;
                    break;
                case 'VIRAL':
                    const viralPost = await Post.findOne({
                        authorId: userId,
                        impressions: {
                            $gte: 1000
                        }
                    });
                    if (viralPost) earned = true;
                    break;
                case 'TRUSTED':
                    if (user.reputationScore >= 100) earned = true;
                    break;
                case 'LEGEND':
                    if (user.reputationScore >= 1000) earned = true;
                    break;
                case 'VERIFIED':
                    if (user.isVerified) earned = true;
                    break;
                case 'BUSINESS_PRO':
                    if (user.businessId) {
                        const Business = require('../models/business');
                        const business = await Business.findById(user.businessId);
                        if (business && business.verified) earned = true;
                    }
                    break;
            }

            if (earned) {
                await UserBadge.create({
                    userId,
                    badgeId: badge._id,
                    earnedAt: new Date()
                });

                eventBus.emit(eventBus.EVENTS.BADGE_EARNED, {
                    user,
                    badge
                });
                console.log(`Badge Assigned: ${badge.name} to ${user.fullName}`);
            }
        }

    } catch (error) {
        console.error("Error in BadgeService:", error);
    }
};