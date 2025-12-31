const Business = require('../models/business');
const User = require('../models/user');

exports.createBusiness = async (req, res, next) => {
    try {
        const {
            name,
            description,
            type,
            industry,
            companySize,
            website
        } = req.body;

        // Business logic: Check if user already has a business if 1:1? 
        // ERD says User has `businessId`. If Business is created, User connects to it.
        // Assuming a user can own/create a business.

        const business = await Business.create({
            name,
            description,
            type, // individual, company
            industry,
            companySize,
            website,
            verified: false,
            reputationScore: 0
        });

        // Link creator to business (Owner)
        // If the User model strictly links 1 user to 1 business via businessId:
        await User.findByIdAndUpdate(req.user._id || req.user.id, {
            businessId: business._id,
            role: 'business' // Upgrade role?
        });

        res.status(201).json({
            success: true,
            business
        });
    } catch (error) {
        next(error);
    }
};

exports.getBusinessById = async (req, res, next) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) return res.status(404).json({
            message: 'Business not found'
        });
        res.json({
            success: true,
            business
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBusiness = async (req, res, next) => {
    try {
        // Authorization: Check if user owns this business
        const user = await User.findById(req.user._id || req.user.id);
        if (!user.businessId || user.businessId.toString() !== req.params.id) {
            // Unless admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Not authorized to update this business'
                });
            }
        }

        const updates = req.body;
        delete updates.reputationScore; // Prevent manual score update
        delete updates.verified; // Prevent manual verification

        const business = await Business.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });
        res.json({
            success: true,
            business
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyBusiness = async (req, res, next) => {
    try {
        // Admin only
        /* if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' }); */

        const business = await Business.findByIdAndUpdate(req.params.id, {
            verified: true
        }, {
            new: true
        });
        if (!business) return res.status(404).json({
            message: 'Business not found'
        });

        const user = await User.findOne({
            businessId: business._id
        });
        if (user) {
            const eventBus = require('../utils/eventBus');
            eventBus.emit(eventBus.EVENTS.BUSINESS_VERIFIED, {
                business,
                user
            });
        }

        res.json({
            success: true,
            business
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllBusinesses = async (req, res, next) => {
    try {
        const businesses = await Business.find().sort({
            reputationScore: -1
        }).limit(50);
        res.json({
            success: true,
            businesses
        });
    } catch (error) {
        next(error);
    }
};