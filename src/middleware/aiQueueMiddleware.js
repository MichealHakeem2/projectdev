const {createClient} = require('redis');
const crypto = require('crypto');
let redisClient;
(async () => {
    if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL not set. AI Queue will run in fallback mode (skipping).');
        return;
    }
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
        console.log('AI Queue Middleware: Redis connected');
    } catch (err) {
        console.error('AI Queue Middleware: Failed to connect to Redis', err.message);
    }
})();
const aiQueueMiddleware = async (req, res, next) => {
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