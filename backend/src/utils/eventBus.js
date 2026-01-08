const EventEmitter = require('events');

class AppEventBus extends EventEmitter {
    constructor() {
        super();
        this.EVENTS = {
            // Post events
            POST_CREATED: 'post:created',
            POST_VIEWED: 'post:viewed',
            POST_UPVOTED: 'post:upvoted',
            POST_DOWNVOTED: 'post:downvoted',
            POST_TRENDING: 'post:trending',

            // Comment events
            COMMENT_CREATED: 'comment:created',

            // Share events
            POST_SHARED: 'post:shared',

            // Reputation events
            REPUTATION_CHANGE: 'reputation:change',
        };
    }
}

const eventBus = new AppEventBus();

module.exports = eventBus;