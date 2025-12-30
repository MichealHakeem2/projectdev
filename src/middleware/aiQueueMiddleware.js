const crypto = require('crypto');
const {getRedisClient} = require('../config/redis');
const aiQueueMiddleware = async (req, res, next) => {
    const redisClient = getRedisClient();

    if ((req.method !== 'POST' && req.method !== 'PUT') || !req.body.content) {
        return next();
    }
    if (!redisClient || !redisClient.isOpen) {
        return next();
    }
    try {
        const task = {
            taskId: crypto.randomUUID(),
            type: req.originalUrl.includes('comment') ? 'analyze_comment' : 'analyze_post',
            payload: {
                content: req.body.content,
                userId: req.user ? req.user._id : 'anonymous',
                resourceId: req.params.id || req.body.postId, // ID of the post being commented on, if applicable
                timestamp: new Date()
            },
            options: {
                priority: 'normal',
                attempts: 0
            }
        };
        await redisClient.lPush('trendverse:ai:queue', JSON.stringify(task));
        req.aiAnalysisPending = true;
    } catch (error) {
        console.error('AI Queue Error:', error);
    }

    next();
};

module.exports = aiQueueMiddleware;