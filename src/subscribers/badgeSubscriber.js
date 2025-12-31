const eventBus = require('../utils/eventBus');
const badgeService = require('../services/badgeService');

const init = () => {

    eventBus.on(eventBus.EVENTS.REPUTATION_CHANGE, async ({
        user
    }) => {
        await badgeService.checkAndAssignBadges(user._id);
    });

    eventBus.on(eventBus.EVENTS.POST_CREATED, async ({
        user
    }) => {
        await badgeService.checkAndAssignBadges(user._id);
    });

    eventBus.on(eventBus.EVENTS.POST_TRENDING, async ({
        post
    }) => {
        await badgeService.checkAndAssignBadges(post.authorId);
    });

    eventBus.on(eventBus.EVENTS.USER_VERIFIED, async ({
        user
    }) => {
        await badgeService.checkAndAssignBadges(user._id);
    });

    console.log('🏅 Badge Subscriber Initialized');
};

module.exports = {
    init
};