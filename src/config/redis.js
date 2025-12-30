const {createClient} = require('redis');
let redisClient = null;

const connectRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL not found in environment variables. Redis features will be disabled.');
        return null;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        await redisClient.connect();
        console.log('Redis connected successfully');
        return redisClient;
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        return null;
    }
};

const getRedisClient = () => {
    return redisClient;
};

module.exports = {
    connectRedis,
    getRedisClient
};