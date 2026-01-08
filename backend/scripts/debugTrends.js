const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Trend = require('../src/models/trend');
const Hashtag = require('../src/models/hashtag');

dotenv.config();

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nti_gp');
        console.log('MongoDB Connected');

        const trendCount = await Trend.countDocuments();
        const hashtagCount = await Hashtag.countDocuments();
        console.log(`Counts -> Trends: ${trendCount}, Hashtags: ${hashtagCount}`);

        const trends = await Trend.find().populate('hashtagId').limit(5);
        console.log('Sample Trends:', JSON.stringify(trends, null, 2));

        // Check for specific orphaned trends
        const orphaned = trends.filter(t => !t.hashtagId);
        if (orphaned.length > 0) {
            console.warn('WARNING: Found trends with null hashtagId (orphaned or populate failed)');
        }

        process.exit(0);
    } catch (error) {
        console.error('Debug Error:', error);
        process.exit(1);
    }
};

debugData();