const notificationSubscriber = require('./notificationSubscriber');
const badgeSubscriber = require('./badgeSubscriber');

const initSubscribers = () => {
    notificationSubscriber.init();
    badgeSubscriber.init();
};

module.exports = initSubscribers;