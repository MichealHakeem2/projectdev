const eventBus = require('../utils/eventBus');
const Notification = require('../models/notification');
const {
    emitToUser,
    emitToCommunity,
    emitGlobal
} = require('../services/socketService');
const {
    updateUserReputation,
    updatePostTrendStatus,
    calculateInteractionImpressions,
    getUserPower
} = require('../utils/trendUtils');

const init = () => {

    eventBus.on(eventBus.EVENTS.POST_CREATED, async ({
        post,
        user
    }) => {
        await updateUserReputation(user._id, 'POST_CREATED');
        await updatePostTrendStatus(post._id, 0);

        emitGlobal('new_post', {
            postId: post._id,
            author: {
                id: user._id,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl
            },
            content: post.content.substring(0, 100),
            timestamp: new Date()
        });
    });

    eventBus.on(eventBus.EVENTS.COMMENT_CREATED, async ({
        comment,
        post,
        user
    }) => {
        await updateUserReputation(user._id, 'COMMENT_CREATED');

        const impPoints = calculateInteractionImpressions('COMMENT', user.reputationScore);
        await updatePostTrendStatus(post._id, impPoints);

        if (post.authorId.toString() !== user._id.toString()) {
            const notification = await Notification.create({
                userId: post.authorId,
                type: 'comment',
                referenceId: post._id,
                message: `${user.fullName} commented on your post`,
                isRead: false
            });

            emitToUser(post.authorId, 'new_notification', {
                id: notification._id,
                type: 'comment',
                message: notification.message,
                referenceId: post._id,
                timestamp: notification.createdAt
            });
        }

        emitToUser(post.authorId, 'post_comment', {
            postId: post._id,
            commentId: comment._id,
            author: {
                id: user._id,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl
            },
            content: comment.content
        });
    });

    eventBus.on(eventBus.EVENTS.POST_UPVOTED, async ({
        post,
        user
    }) => {
        await updateUserReputation(post.authorId, 'POST_UPVOTED_BY_OTHERS', {
            voterReputation: user.reputationScore
        });

        const impPoints = calculateInteractionImpressions('UPVOTE', user.reputationScore);
        await updatePostTrendStatus(post._id, impPoints);

        emitToUser(post.authorId, 'post_upvoted', {
            postId: post._id,
            voter: {
                id: user._id,
                fullName: user.fullName
            },
            newUpvoteCount: post.upvotes + 1
        });
    });

    eventBus.on(eventBus.EVENTS.POST_DOWNVOTED, async ({
        post,
        user
    }) => {
        const impPoints = calculateInteractionImpressions('DOWNVOTE', user.reputationScore);
        await updatePostTrendStatus(post._id, impPoints);

        await updateUserReputation(user._id, 'POST_DOWNVOTED');
    });

    eventBus.on(eventBus.EVENTS.POST_VIEWED, async ({
        post,
        user
    }) => {
        const impPoints = calculateInteractionImpressions('VIEW', user.reputationScore);
        await updatePostTrendStatus(post._id, impPoints);
    });

    eventBus.on(eventBus.EVENTS.POST_TRENDING, async ({
        post,
        trend
    }) => {
        await updateUserReputation(post.authorId, 'POST_TRENDING');

        const notification = await Notification.create({
            userId: post.authorId,
            type: 'trend',
            referenceId: post._id,
            message: `Your post is trending! 🔥`,
            isRead: false
        });

        emitToUser(post.authorId, 'new_notification', {
            id: notification._id,
            type: 'trend',
            message: notification.message,
            referenceId: post._id,
            timestamp: notification.createdAt
        });

        emitGlobal('trending_post', {
            postId: post._id,
            trendScore: trend.score,
            status: trend.status,
            author: post.authorId
        });
    });

    eventBus.on(eventBus.EVENTS.USER_VERIFIED, async ({
        user
    }) => {
        await updateUserReputation(user._id, 'EMAIL_VERIFIED');

        const notification = await Notification.create({
            userId: user._id,
            type: 'system',
            message: `Welcome! Your account is now verified ✓`,
            isRead: false
        });

        emitToUser(user._id, 'new_notification', {
            id: notification._id,
            type: 'system',
            message: notification.message,
            timestamp: notification.createdAt
        });

        emitToUser(user._id, 'account_verified', {
            reputationBonus: 10
        });
    });

    eventBus.on(eventBus.EVENTS.BUSINESS_VERIFIED, async ({
        business,
        user
    }) => {
        await updateUserReputation(user._id, 'BUSINESS_VERIFIED');

        const notification = await Notification.create({
            userId: user._id,
            type: 'business',
            referenceId: business._id,
            message: `Your business "${business.name}" has been verified! 🎉`,
            isRead: false
        });

        emitToUser(user._id, 'new_notification', {
            id: notification._id,
            type: 'business',
            message: notification.message,
            referenceId: business._id,
            timestamp: notification.createdAt
        });

        emitToUser(user._id, 'business_verified', {
            businessId: business._id,
            businessName: business.name,
            reputationBonus: 100
        });
    });

    eventBus.on(eventBus.EVENTS.BADGE_EARNED, async ({
        user,
        badge
    }) => {
        const notification = await Notification.create({
            userId: user._id,
            type: 'badge',
            message: `You earned a new badge: ${badge.name}! 🏅`,
            isRead: false
        });

        emitToUser(user._id, 'new_notification', {
            id: notification._id,
            type: 'badge',
            message: notification.message,
            timestamp: notification.createdAt
        });

        emitToUser(user._id, 'badge_earned', {
            badgeId: badge._id,
            badgeName: badge.name,
            badgeDescription: badge.description,
            badgeImageUrl: badge.imageUrl,
            rarity: badge.rarity
        });
    });

    eventBus.on(eventBus.EVENTS.AI_FLAGGED_SPAM, async ({
        target,
        user
    }) => {
        await updateUserReputation(user._id, 'SPAM_DETECTED');

        emitToUser(user._id, 'content_flagged', {
            type: 'spam',
            targetId: target._id,
            penalty: -50
        });
    });

    eventBus.on(eventBus.EVENTS.AI_FLAGGED_HYPE, async ({
        target,
        user
    }) => {
        await updateUserReputation(user._id, 'HYPE_DETECTED');

        emitToUser(user._id, 'content_flagged', {
            type: 'hype',
            targetId: target._id,
            penalty: -100
        });
    });

    console.log('🔗 Notification Subscriber Initialized');
};

module.exports = {
    init
};