const Comment = require("../models/Comment");


exports.createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;

    const comment = await Comment.create({
      content,
      post: postId,
      author: req.user.id   
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

   
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.content = req.body.content || comment.content;
    await comment.save();

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: "Comment deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.listCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
