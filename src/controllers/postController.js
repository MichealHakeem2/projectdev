const Post = require('../models/post');
const User = require('../models/user');
const eventBus = require('../utils/eventBus');

exports.createPost = async (req, res, next) => {
  try {
    const {
      content,
      mediaUrl,
      categoryId,
      tag,
      hashtagId,
      businessId
    } = req.body;

    const postData = {
      content,
      authorId: req.user._id || req.user.id,
      mediaUrl,
      categoryId,
      tag,
      hashtagId,
      businessId,
      impressions: 0
    };

    const post = await Post.create(postData);

    eventBus.emit(eventBus.EVENTS.POST_CREATED, {
      post,
      user: req.user
    });

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const limit = req.pagination ? req.pagination.limit : 20;
    const skip = req.pagination ? req.pagination.skip : 0;

    const posts = await Post.find()
      .populate('authorId', 'fullName avatarUrl')
      .populate('businessId', 'name avatarUrl')
      .populate('categoryId', 'name')
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id)
      .populate('authorId', 'fullName avatarUrl')
      .populate('businessId', 'name')
      .populate('categoryId', 'name');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    eventBus.emit(eventBus.EVENTS.POST_VIEWED, {
      post,
      user: req.user
    });

    post.uniqueViews += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

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

    eventBus.emit(eventBus.EVENTS.POST_UPVOTED, {
      post,
      user: req.user
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

    if (!post) return res.status(404).json({
      message: 'Post not found'
    });

    eventBus.emit(eventBus.EVENTS.POST_DOWNVOTED, {
      post,
      user: req.user
    });

    res.json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};