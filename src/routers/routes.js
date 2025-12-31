const router = require("express").Router();
const {
    check
} = require('express-validator');
const authMiddleware = require("../middleware/authMiddleware");
const cache = require("../controllers/cacheController");
const guestBlock = require("../middleware/guestBlockMiddleware");
const roleCheck = require("../middleware/roleMiddleware");
const ownershipCheck = require("../middleware/ownershipMiddleware");
const pagination = require("../middleware/paginationMiddleware");

const validate = require("../middleware/validateMiddleware");
const communityRole = require("../middleware/communityRoleMiddleware");
const aiQueue = require("../middleware/aiQueueMiddleware");

const {
    uploadSingle
} = require("../middleware/fileUploadMiddleware");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const trendController = require("../controllers/trendController");
const communityController = require("../controllers/communityController");
const communityChatController = require("../controllers/communityChatController");
const chatController = require("../controllers/chatController");
const notificationController = require("../controllers/notificationController");
const businessController = require("../controllers/businessController");
const categoryController = require("../controllers/categoryController");
const badgeController = require("../controllers/badgeController");
const keywordController = require("../controllers/keywordController");
const promotedTrendController = require("../controllers/promotedtrendController");
const aiController = require("../controllers/aiController");
const analyticsController = require("../controllers/analyticsController");

router.post("/signup", [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({
        min: 6
    }),
    check('fullName', 'Name is required').not().isEmpty()
], validate, authController.signup);

router.post("/login", [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], validate, authController.login);

router.post("/logout", authController.logout);
router.post("/guest-login", authController.createGuestUser);

router.post("/send-verification", authMiddleware, authController.sendVerificationCode);
router.post("/verify-email", authMiddleware, authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/users/profile", authMiddleware, userController.getProfile);
router.put("/users/profile", authMiddleware, userController.updateUserProfile);
router.put("/users/password", authMiddleware, userController.updatePassword);
router.get("/users/:id", authMiddleware, userController.getUserById);
router.get("/feed", authMiddleware, pagination, userController.getUserFeed);
router.post("/users/:id/badges", authMiddleware, roleCheck('admin'), userController.assignBadgeToUser);

router.post("/posts", authMiddleware, guestBlock, [
    check('content', 'Content is required').not().isEmpty()
], validate, postController.createPost);

router.get("/posts", authMiddleware, pagination, postController.getPosts);
router.get("/posts/:id", authMiddleware, postController.getPostById);
router.post("/posts/:id/upvote", authMiddleware, guestBlock, postController.upvotePost);
router.post("/posts/:id/downvote", authMiddleware, guestBlock, postController.downvotePost);

router.post("/comments", authMiddleware, guestBlock, aiQueue, commentController.createComment);
router.put("/comments/:id", authMiddleware, ownershipCheck('Comment'), commentController.updateComment);
router.delete("/comments/:id", authMiddleware, ownershipCheck('Comment'), commentController.deleteComment);
router.get("/posts/:postId/comments", pagination, commentController.listCommentsByPost);

router.get("/trends", cache.middleware(60), trendController.getGlobalTrends);
router.get("/trends/:id", trendController.getTrendById);

router.post("/communities", authMiddleware, guestBlock, communityController.createCommunity);
router.get("/communities", authMiddleware, pagination, communityController.getAllCommunities);
router.get("/communities/:id", authMiddleware, communityController.getCommunityById);
router.post("/communities/join", authMiddleware, guestBlock, communityController.joinCommunity);
router.delete("/communities/:id/leave", authMiddleware, communityController.leaveCommunity);
router.get("/communities/:id/members", authMiddleware, pagination, communityController.getCommunityMembers);

router.post("/communities/:communityId/messages", authMiddleware, communityRole(['member', 'admin', 'moderator']), communityChatController.sendCommunityMessage);
router.get("/communities/:communityId/messages", authMiddleware, pagination, communityChatController.getCommunityMessages);
router.put("/communities/messages/:messageId/read", authMiddleware, communityChatController.markMessageRead);

router.post("/chat/send", authMiddleware, chatController.sendMessage);
router.get("/chat/history/:friendId", authMiddleware, pagination, chatController.getChatHistory);
router.put("/chat/read", authMiddleware, chatController.markAsRead);
router.delete("/chat/message/:messageId", authMiddleware, chatController.deleteMessage);
router.post("/chat/upload", authMiddleware, uploadSingle('file'), chatController.uploadFile);

router.get("/notifications", authMiddleware, pagination, notificationController.getNotifications);
router.put("/notifications/:id/read", authMiddleware, notificationController.markAsRead);
router.delete("/notifications/:id", authMiddleware, notificationController.deleteNotification);

router.post("/businesses", authMiddleware, businessController.createBusiness);
router.get("/businesses", authMiddleware, pagination, businessController.getAllBusinesses);
router.get("/businesses/:id", authMiddleware, businessController.getBusinessById);
router.put("/businesses/:id", authMiddleware, businessController.updateBusiness);
router.post("/businesses/:id/verify", authMiddleware, roleCheck('admin'), businessController.verifyBusiness);

router.post("/categories", authMiddleware, categoryController.createCategory);
router.get("/categories", authMiddleware, pagination, categoryController.getCategories);
router.get("/categories/:id", authMiddleware, categoryController.getCategoryById);
router.put("/categories/:id", authMiddleware, categoryController.updateCategory);
router.delete("/categories/:id", authMiddleware, categoryController.deleteCategory);

router.post("/badges", authMiddleware, roleCheck('admin'), badgeController.createBadge);
router.get("/badges", authMiddleware, badgeController.getAllBadges);
router.get("/badges/:id", authMiddleware, badgeController.getBadgeById);
router.put("/badges/:id", authMiddleware, roleCheck('admin'), badgeController.updateBadge);

router.get("/keywords", authMiddleware, pagination, keywordController.getAllKeywords);
router.get("/keywords/:id", authMiddleware, keywordController.getKeywordStats);

router.post("/promotions", authMiddleware, promotedTrendController.createPromotion);
router.get("/promotions/active", authMiddleware, promotedTrendController.getActivePromotions);
router.put("/promotions/:id/stop", authMiddleware, promotedTrendController.stopPromotion);

router.post("/ai/chat", authMiddleware, aiController.chatWithAI);

router.get("/analytics/dashboard", authMiddleware, analyticsController.getDashboardStats);
router.post("/analytics/run", authMiddleware, analyticsController.runAnalysis);
router.get("/analytics/target/:targetType/:targetId", authMiddleware, analyticsController.getAnalysisForTarget);

module.exports = router;