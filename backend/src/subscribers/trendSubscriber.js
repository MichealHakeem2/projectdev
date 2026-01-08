const eventBus = require('../utils/eventBus');
const {
    updatePostTrendStatus
} = require('../utils/trendUtils');

/**
 * Handle trend updates based on post interactions
 */
const handleTrendUpdate = async (post, action, user = null) => {
    try {
        if (!post) return;

        let impressionChange = 0;
        const reputationScore = user ? user.reputationScore : 0;

        // Calculate weighted impressions based on action and user reputation
        switch (action) {
            case 'VIEW':
                impressionChange = 1;
                break;
            case 'UPVOTE':
                // Base 2 points, multiplied by user's reputation power
                const upvotePower = Math.log10(Math.max(0, reputationScore) + 10);
                impressionChange = 2 * upvotePower;
                break;
            case 'DOWNVOTE':
                const downvotePower = Math.log10(Math.max(0, reputationScore) + 10);
                impressionChange = -2 * downvotePower;
                break;
            case 'COMMENT':
                const commentPower = Math.log10(Math.max(0, reputationScore) + 10);
                impressionChange = 3 * commentPower;
                break;
            case 'SHARE':
                const sharePower = Math.log10(Math.max(0, reputationScore) + 10);
                impressionChange = 5 * sharePower;
                break;
        }

        await updatePostTrendStatus(post._id || post.id, impressionChange);

    } catch (error) {
        console.error('Error in trendSubscriber:', error);
    }
};

/**
 * Initialize event listeners for trend tracking
 */
const init = () => {
    // Post viewed
    eventBus.on(eventBus.EVENTS.POST_VIEWED, ({
            post
        }) =>
        handleTrendUpdate(post, 'VIEW')
    );

    // Post upvoted
    eventBus.on(eventBus.EVENTS.POST_UPVOTED, ({
            post,
            user
        }) =>
        handleTrendUpdate(post, 'UPVOTE', user)
    );

    // Post created
    eventBus.on(eventBus.EVENTS.POST_CREATED, ({
            post,
            user
        }) =>
        handleTrendUpdate(post, 'VIEW', user) // Treat creation как a view for initial score
    );

    // Post downvoted
    eventBus.on(eventBus.EVENTS.POST_DOWNVOTED, ({
            post,
            user
        }) =>
        handleTrendUpdate(post, 'DOWNVOTE', user)
    );

    // Comment created
    eventBus.on(eventBus.EVENTS.COMMENT_CREATED, ({
            post,
            user
        }) =>
        handleTrendUpdate(post, 'COMMENT', user)
    );

    // Post shared
    eventBus.on(eventBus.EVENTS.POST_SHARED, ({
            post,
            user
        }) =>
        handleTrendUpdate(post, 'SHARE', user)
    );

    console.log('✅ Trend subscriber initialized');
};

module.exports = {
    init
};