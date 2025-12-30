const {createClient} = require('redis');
let redisClient;
(async () => {
    if (process.env.REDIS_URL) {
        try {
            redisClient = createClient({
                url: process.env.REDIS_URL
            });
            redisClient.on('error', (err) => console.error('Rate Limit Redis Error', err));
            await redisClient.connect();
        } catch (err) {
            console.error('Rate Limit Redis Connection Failed', err);
        }
    }
})();
const rateLimitMiddleware = (limit = 100, windowSeconds = 60) => {
    return async (req, res, next) => {
        const ip = req.ip;
        const key = `rate_limit:${ip}`;

        if (redisClient && redisClient.isOpen) {
            try {
                const requests = await redisClient.incr(key);

                if (requests === 1) {
                    await redisClient.expire(key, windowSeconds);
                }

                if (requests > limit) {
                    const ttl = await redisClient.ttl(key);
                    return res.status(429).json({
                        success: false,
                        message: 'Too many requests, please try again later.',
                        retryAfter: ttl
                    });
                }

                res.setHeader('X-RateLimit-Limit', limit);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requests));

                return next();
            } catch (error) {
                console.error('Rate Limit Redis Error', error);
            }
        }
        if (!global.rateLimitStore) global.rateLimitStore = new Map();
        const now = Date.now();
        const windowStart = now - (windowSeconds * 1000);
        let record = global.rateLimitStore.get(ip);
        if (!record || record.windowStart < windowStart) {
            record = {
                count: 1,
                windowStart: now
            };
        } else {
            record.count += 1;
        }
        global.rateLimitStore.set(ip, record);
        if (global.rateLimitStore.size > 10000) global.rateLimitStore.clear();

        if (record.count > limit) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.'
            });
        }

        next();
    };
};

module.exports = rateLimitMiddleware;