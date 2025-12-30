const Post = require('../models/Post');

exports.createPost = async (req, res, next) => {
  try {
    const { content, media, keywords } = req.body;
    const post = await Post.create({
      content,
      media: media || [],
      keywords: keywords || [],
      author: req.user._id,
    });

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

exports.getTrendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name')
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(20);

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

exports.upvotePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.upvotes = post.upvotes.filter(u => u.toString() !== req.user._id.toString());
 
    if (!post.upvotes.includes(req.user._id)) {
      post.upvotes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
  exports.upvotePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.upvotes = post.upvotes.filter(u => u.toString() !== req.user._id.toString());
 
    if (!post.upvotes.includes(req.user._id)) {
      post.upvotes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};
  exports.downvotePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.downvotes = post.downvotes.filter(u => u.toString() !== req.user._id.toString());
 
    if (!post.downvotes.includes(req.user._id)) {
      post.downvotes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};
}