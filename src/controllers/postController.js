const Post = require('../models/Post');
const mongoose = require('mongoose');

exports.createPost = async (req, res, next) => {
  try {
    const {
      content,
      mediaUrl,
      categoryId,
      tag,
      hashtagsId,
      businessId
    } = req.body;

    const postData = {
      content,
      authorId: req.user._id,
      mediaUrl,
      categoryId,
      tag,
      hashtagsId, 
      businessId
    };

    const post = await Post.create(postData);

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('authorId', 'fullName avatarUrl')
      .populate('businessId', 'name avatarUrl')
      .populate('categoryId', 'name')
      .sort({
        createdAt: -1
      })
      .limit(20);

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'fullName avatarUrl')
      .populate('businessId', 'name')
      .populate('categoryId', 'name');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.uniqueViews += 1;
    post.impressions += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
exports.upvotePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, {
        $inc: {
          upvotes: 1
        }
      }, {
        new: true
      }
    );

    if (!post) return res.status(404).json({
      message: 'Post not found'
    });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};
exports.downvotePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, {
        $inc: {
          downvotes: 1
        }
      }, {
        new: true
      }
    );

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};
}