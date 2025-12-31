const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const AIAnalysis = require("../models/aianalysis");
const eventBus = require("../utils/eventBus");

exports.createComment = async (req, res, next) => {
  try {
    const {
      content,
      postId
    } = req.body;
    const authorId = req.user._id || req.user.id;

    const author = await User.findById(authorId);
    if (!author) return res.status(404).json({
      message: "User not found"
    });

    let aiResult = {
      label: 'genuine',
      score: 0,
      keywords: []
    };

    try {
      const aiResponse = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          comments: [content]
        })
      });
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        if (data.results && data.results.length > 0) {
          aiResult = {
            label: data.results[0].classification.label,
            score: data.results[0].classification.score,
            keywords: data.results[0].keywords
          };
        }
      }
    } catch (err) {}

    let commentType = 'original';
    if (aiResult.label === 'ai-generated') commentType = 'ai-generated';
    else if (aiResult.label === 'hype') commentType = 'hype';

    const comment = await Comment.create({
      content,
      postId,
      authorId,
      type: commentType,
      sentimentScore: 0,
      authenticityScore: aiResult.label === 'genuine' ? 1 : 0.1
    });

    await AIAnalysis.create({
      targetType: "comment",
      targetId: comment._id,
      model: "trendverse-local-bart",
      sentiment: 0,
      keywords: aiResult.keywords,
      authenticity: aiResult.label === 'genuine' ? 1.0 : 0.0,
      commentId: comment._id
    });

    const post = await Post.findByIdAndUpdate(postId, {
      $inc: {
        commentsCount: 1
      }
    }, {
      new: true
    });

    eventBus.emit(eventBus.EVENTS.COMMENT_CREATED, {
      comment,
      post,
      user: req.user
    });

    res.status(201).json({
      success: true,
      data: comment,
      analysis: aiResult
    });
  } catch (error) {
    next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({
      message: "Comment not found"
    });

    comment.content = req.body.content || comment.content;
    await comment.save();

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({
      message: "Comment not found"
    });

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.postId, {
      $inc: {
        commentsCount: -1
      }
    });

    res.json({
      success: true,
      message: "Comment deleted"
    });
  } catch (error) {
    next(error);
  }
};

exports.listCommentsByPost = async (req, res, next) => {
  try {
    const {
      limit = 50
    } = req.query;
    const comments = await Comment.find({
        postId: req.params.postId
      })
      .populate("authorId", "fullName avatarUrl")
      .sort({
        createdAt: -1
      })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};