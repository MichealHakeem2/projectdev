const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hashtag = require('../src/models/hashtag');
const Trend = require('../src/models/Trend');
const Business = require('../src/models/business');
const User = require('../src/models/User'); // Assuming User model exists
const PromotedTrend = require('../src/models/promotedTrend');

const path = require('path');
// Load env vars from backend/.env
dotenv.config({
    path: path.join(__dirname, '../.env')
});

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nti_gp');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to DB', err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        console.log('Clearing existing trend/keyword data...');
        // Optional: Clear detailed collections
        // await Hashtag.deleteMany({});
        // await Trend.deleteMany({});
        // await PromotedTrend.deleteMany({});

        // 1. Create a Dummy User and Business (needed for promoted trends)
        console.log('Ensuring dummy business exists...');
        let user = await User.findOne({
            email: 'seed_business@test.com'
        });
        if (!user) {
            user = await User.create({
                username: 'GlobalTech_Seed',
                email: 'seed_business@test.com',
                password: 'hashedpassword123', // Dummy hash
                fullName: 'Global Tech Corp',
                accountType: 'business'
            });
        }

        let business = await Business.findOne({
            userId: user._id
        });
        if (!business) {
            business = await Business.create({
                userId: user._id,
                name: 'Global Tech Corp',
                type: 'company',
                industry: 'Technology',
                description: 'Leading the future of AI'
            });
        }

        // 2. Define Hashtags with Categories
        const hashtagsData = [{
                name: 'GenerativeAI',
                count: 8500
            },
            {
                name: 'RemoteWork',
                count: 6200
            },
            {
                name: 'CryptoMarkets',
                count: 7800
            },
            {
                name: 'SustainableDesign',
                count: 4100
            },
            {
                name: 'StartupFunding',
                count: 5300
            },
            {
                name: 'QuantumComputing',
                count: 3200
            },
            {
                name: 'GreenEnergy',
                count: 4900
            },
            {
                name: 'UXTrends2026',
                count: 2800
            }
        ];

        console.log('Creating Hashtags...');
        const hashtagDocs = [];
        for (const h of hashtagsData) {
            // Upsert hashtags
            let hashtag = await Hashtag.findOne({
                name: h.name.toLowerCase()
            });
            if (!hashtag) {
                hashtag = await Hashtag.create({
                    name: h.name.toLowerCase(),
                    count: h.count
                });
            } else {
                // Update stats
                hashtag.count = h.count;
                await hashtag.save();
            }
            hashtagDocs.push(hashtag);
        }

        // 3. Create Trends linking to these hashtags
        console.log('Creating Trends...');
        for (const hDoc of hashtagDocs) {
            let trend = await Trend.findOne({
                hashtagId: hDoc._id
            });
            if (!trend) {
                await Trend.create({
                    hashtagId: hDoc._id,
                    score: (hDoc.count || 0) / 100, // Dummy algo
                    velocity: 0,
                    status: (hDoc.count || 0) > 5000 ? 'hot' : 'rising',
                });
            }
        }

        // 4. Create a Promoted Trend (e.g., QuantumComputing)
        const promoHashtag = hashtagDocs.find(h => h.name.toLowerCase() === 'quantumcomputing');
        if (promoHashtag) {
            const trendToPromote = await Trend.findOne({
                hashtagId: promoHashtag._id
            });
            if (trendToPromote) {
                console.log('Creating Promoted Trend for:', promoHashtag.name);

                // Check if already promoted
                const existingPromo = await PromotedTrend.findOne({
                    trendId: trendToPromote._id,
                    active: true
                });

                if (!existingPromo) {
                    const promo = await PromotedTrend.create({
                        trendId: trendToPromote._id,
                        businessId: business._id,
                        startAt: new Date(),
                        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
                        active: true,
                        adPackage: 'boost'
                    });

                    // Update trend
                    trendToPromote.promotedTrendId = promo._id;
                    trendToPromote.sourceType = 'promoted';
                    await trendToPromote.save();
                }
            }
        }

        console.log('Seed Complete! Created/Updated 8 keywords and trends.');
        process.exit(0);

    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedData();