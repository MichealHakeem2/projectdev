const {createClient} = require('redis');
let redisClient;
(async () => {
    if (process.env.REDIS_URL) {
        try {
            redisClient = createClient({
                url: process.env.REDIS_URL
            });
            await redisClient.connect();
        } catch (e) {}
    }
})();
const tokenBlacklistMiddleware = async (req, res, next) => {
    if (!redisClient || !redisClient.isOpen) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    const key = `blacklist:${token}`;

    try {
        const isBlacklisted = await redisClient.get(key);

        if (isBlacklisted) {
            return res.status(401).json({
                success: false,
                message: 'Session expired or logged out. Please login again.'
            });
        }

        next();
    } catch (error) {
        console.error('Blacklist check failed', error);
        next();
    }
};

module.exports = tokenBlacklistMiddleware;