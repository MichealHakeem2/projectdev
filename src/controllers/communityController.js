const Community = require('../models/community');
const CommunityMember = require('../models/communityMember');

// --- Community CRUD ---

exports.createCommunity = async (req, res, next) => {
    try {
        const {
            name,
            description,
            avatarUrl,
            isPrivate
        } = req.body;
        const creatorId = req.user._id || req.user.id;

        const community = await Community.create({
            name,
            description,
            avatarUrl,
            creatorId,
            isPrivate: isPrivate || false
        });

        // Add creator as Admin member
        await CommunityMember.create({
            userId: creatorId,
            communityId: community._id,
            role: 'admin',
            joinedAt: new Date()
        });

        res.status(201).json({
            success: true,
            community
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllCommunities = async (req, res, next) => {
    try {
        const communities = await Community.find({
                isPrivate: false
            }) // Public only
            .populate('creatorId', 'fullName avatarUrl')
            .sort({
                createdAt: -1
            });
        res.json({
            success: true,
            communities
        });
    } catch (error) {
        next(error);
    }
};

exports.getCommunityById = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id).populate('creatorId', 'fullName avatarUrl');
        if (!community) return res.status(404).json({
            message: 'Community not found'
        });

        // Private check? 
        // If private, check membership.
        if (community.isPrivate) {
            const userId = req.user._id || req.user.id;
            const member = await CommunityMember.findOne({
                communityId: community._id,
                userId
            });
            if (!member) return res.status(403).json({
                message: 'Private community'
            });
        }

        res.json({
            success: true,
            community
        });
    } catch (error) {
        next(error);
    }
};

// --- Membership ---

exports.joinCommunity = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            communityId
        } = req.body;

        const community = await Community.findById(communityId);
        if (!community) return res.status(404).json({
            message: 'Community not found'
        });

        if (community.isPrivate) {
            // Logic for request-to-join would go here. For now, strict.
            return res.status(403).json({
                message: 'Cannot join private community directly'
            });
        }

        const existing = await CommunityMember.findOne({
            userId,
            communityId
        });
        if (existing) return res.status(400).json({
            message: 'Already a member'
        });

        const member = await CommunityMember.create({
            userId,
            communityId,
            role: 'member'
        });

        res.status(201).json({
            success: true,
            member
        });
    } catch (error) {
        next(error);
    }
};

exports.leaveCommunity = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const {
            id: communityId
        } = req.params;

        await CommunityMember.findOneAndDelete({
            userId,
            communityId
        });
        res.json({
            success: true,
            message: 'Left community'
        });
    } catch (error) {
        next(error);
    }
};

exports.getCommunityMembers = async (req, res, next) => {
    try {
        const {
            id: communityId
        } = req.params;
        const members = await CommunityMember.find({
            communityId
        }).populate('userId', 'fullName avatarUrl reputationScore');
        res.json({
            success: true,
            members
        });
    } catch (error) {
        next(error);
    }
};