const Trend = require('../models/trend');
const Post = require('../models/post');
const Hashtag = require('../models/hashtag');
exports.getHashtags = async (req, res, next) => {
    try {
        // Optional: filter by category
        const {
            category,
            limit
        } = req.query;

        let query = {};
        if (category && category !== 'All') {
            query.category = {
                $regex: new RegExp(category, 'i')
            };
        }

        // Sort by usage count descending
        const hashtags = await Hashtag.find(query)
            .sort({
                count: -1
            })
            .limit(parseInt(limit) || 20);

        res.json({
            success: true,
            data: hashtags.map(h => ({
                _id: h._id,
                name: h.name,
                count: h.count
            }))
        });
    } catch (error) {
        console.error('[Hashtags] Error fetching hashtags:', error);
        next(error);
    }
};

// 2️⃣ Get posts by hashtag
exports.getPostsByHashtag = async (req, res, next) => {
    try {
        const {
            hashtag,
            category,
            page = 1,
            limit = 10
        } = req.query;
        const skip = (page - 1) * limit;

        if (!hashtag) return res.status(400).json({
            success: false,
            message: 'Hashtag is required'
        });

        // Find the hashtag document
        const hashtagDoc = await Hashtag.findOne({
            name: new RegExp(`^${hashtag}$`, 'i')
        });
        if (!hashtagDoc) return res.json({
            success: true,
            data: {
                posts: [],
                total: 0,
                hasMore: false
            }
        });

        // Build query for posts
        let postQuery = {
            hashtags: hashtagDoc._id,
            communityId: null // Exclude community posts
        };

        if (category && category !== 'All') {
            postQuery.categoryId = await Category.findOne({
                name: new RegExp(category, 'i')
            });
        }

        const total = await Post.countDocuments(postQuery);
        const posts = await Post.find(postQuery)
            .populate('authorId', 'username fullName avatarUrl accountType')
            .populate('businessId', 'name avatarUrl')
            .populate('categoryId', 'name')
            .populate('hashtags', 'name')
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: {
                posts,
                total,
                hasMore: skip + posts.length < total
            }
        });
    } catch (error) {
        console.error('[Posts] Error fetching posts by hashtag:', error);
        next(error);
    }
};

exports.getTrendingTopics = async (req, res, next) => {
    try {
        const {
            status,
            limit,
            category
        } = req.query;

        const query = {};
        if (status) query.status = status;

        // 1. Fetch promoted trends first
        let promotedTrends = await Trend.find({
                ...query,
                promotedTrendId: {
                    $ne: null
                }
            })
            .populate({
                path: 'hashtagId',
                select: 'name'
            })
            .populate({
                path: 'postId',
                populate: [{
                        path: 'hashtags',
                        select: 'name'
                    },
                    {
                        path: 'categoryId',
                        select: 'name'
                    }
                ]
            })
            .populate('promotedTrendId')
            .sort({
                score: -1
            })
            .limit(3);

        // 2. Fetch organic trends
        const MINIMUM_SCORE = 3;
        let organicTrends = await Trend.find({
                ...query,
                promotedTrendId: null,
                score: {
                    $gte: 2 // Show anything with a hashtag for now
                }
            })
            .populate({
                path: 'postId',
                populate: [{
                        path: 'hashtags',
                        select: 'name'
                    },
                    {
                        path: 'categoryId',
                        select: 'name'
                    }
                ]
            })
            .sort({
                score: -1
            })
            .limit(parseInt(limit) || 10);

        // TEMPORARY: Disable strict hashtag filtering to see if trends appear
        // promotedTrends = promotedTrends.filter(t => t.postId ? (t.postId.hashtags ? t.postId.hashtags.length > 0 : false) : false);
        // organicTrends = organicTrends.filter(t => t.postId ? (t.postId.hashtags ? t.postId.hashtags.length > 0 : false) : false);

        let trends = [...promotedTrends, ...organicTrends];

        // Format for frontend
        const formattedTrends = trends.map(t => {
            const post = t.postId || {};
            const hashtag = t.hashtagId || {};
            let trendName = hashtag.name || (post.tag || 'Trending');

            return {
                _id: t._id,
                name: trendName,
                count: t.score || 0,
                growth: t.velocity || 0,
                isPromoted: !!t.promotedTrendId,
                promotionLabel: t.promotedTrendId ? (t.promotedTrendId.adPackage ? `${t.promotedTrendId.adPackage} PROMOTION` : 'Promoted') : '',
                category: t.categoryId ? t.categoryId.name : '',
                hashtagId: hashtag._id ? hashtag._id.toString() : '',
                postId: post._id
            };
        });

        console.log(`[Trends] Returning ${formattedTrends.length} trends`);
        res.json({
            success: true,
            data: formattedTrends,
            count: formattedTrends.length
        });
    } catch (error) {
        console.error('[Trends] Error fetching hashtag topics:', error, {
            user: req.user ? req.user._id : null || '',
            query: req.query
        });
        next(error);
    }
};

exports.getTrendingPosts = async (req, res, next) => {
    try {
        const {
            category,
            hashtag
        } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const MINIMUM_SCORE = 5;

        // Fetch trends linked to posts (promoted or high score)
        let trendQuery = {
            postId: {
                $ne: null
            },
            $or: [{
                    score: {
                        $gte: MINIMUM_SCORE
                    }
                },
                {
                    promotedTrendId: {
                        $ne: null
                    }
                },
                {
                    sourceType: 'promoted'
                }
            ]
        };

        const trendingEntries = await Trend.find(trendQuery)
            .populate('promotedTrendId')
            .sort({
                score: -1
            })
            .populate({
                path: 'postId',
                populate: [{
                        path: 'authorId',
                        select: 'username fullName avatarUrl accountType'
                    },
                    {
                        path: 'businessId',
                        select: 'name avatarUrl'
                    },
                    {
                        path: 'hashtags',
                        select: 'name'
                    },
                    {
                        path: 'categoryId',
                        select: 'name'
                    }
                ]
            });

        // Filter posts
        let posts = trendingEntries
            .map(entry => entry.postId)
            .filter(post => {
                if (!post) return false;

                // 1. Exclude community posts
                if (post.communityId != null) return false;

                // 2. Filter by category
                if (category && category !== 'All') {
                    const regex = new RegExp(category, 'i');
                    const matchesCategory =
                        (post.categoryId ? post.categoryId.name && regex.test(post.categoryId.name) : false) ||
                        (post.hashtags ? post.hashtags.some(h => regex.test(h.name)) : false) ||
                        (post.tag && regex.test(post.tag)) ||
                        (post.content && regex.test(post.content));
                    if (!matchesCategory) return false;
                }

                // 3. Filter by hashtag
                if (hashtag) {
                    const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
                    const regex = new RegExp(`^${cleanHashtag}$`, 'i'); // Exact match
                    const matchesHashtag =
                        (post.hashtags ? post.hashtags.some(h => regex.test(h.name)) : false) ||
                        (post.tag && regex.test(post.tag));
                    if (!matchesHashtag) return false;
                }

                return true;
            });

        // Pagination
        const total = posts.length;
        const paginatedPosts = posts.slice(skip, skip + limit);

        res.json({
            success: true,
            data: {
                posts: paginatedPosts.map(p => {
                    const obj = p.toObject ? p.toObject() : p;
                    return {
                        ...obj,
                        author: obj.authorId,
                        business: obj.businessId
                    };
                }),
                hasMore: skip + paginatedPosts.length < total,
                total
            }
        });
    } catch (error) {
        console.error('[Trends] Error fetching posts:', error);
        next(error);
    }
};


exports.getTrendById = async (req, res, next) => {
    try {
        const trend = await Trend.findById(req.params.id)
            .populate('keywordId')
            .populate('postId');

        if (!trend) return res.status(404).json({
            message: 'Trend not found'
        });

        res.json({
            success: true,
            trend
        });
    } catch (error) {
        next(error);
    }
};

// System / Admin function to calculate or update trends
exports.updateTrendStatus = async (req, res, next) => {
    try {
        // Typically restricted
        // if (req.user.role !== 'admin') ... 

        const {
            id
        } = req.params;
        const {
            status,
            score,
            velocity
        } = req.body;

        const trend = await Trend.findByIdAndUpdate(id, {
            status,
            score,
            velocity,
            lastUpdated: new Date()
        }, {
            new: true
        });

        if (!trend) return res.status(404).json({
            message: 'Trend not found'
        });

        res.json({
            success: true,
            trend
        });
    } catch (error) {
        next(error);
    }
};