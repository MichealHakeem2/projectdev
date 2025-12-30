const router = require("express").Router();
const { signup, login, logout } = require("../controllers/authController");
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);


router.post("/comments", auth, commentController.createComment);
router.put("/comments/:id", auth, commentController.updateComment);
router.delete("/comments/:id", auth, commentController.deleteComment);

router.get(
  "/posts/:postId/comments",
  commentController.listCommentsByPost
);

module.exports = router;
