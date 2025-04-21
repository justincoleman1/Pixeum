// controllers/commentController.js
const catchAsync = require('../utils/catchAsync');
const Comment = require('../models/commentModel');
const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setCommentUserIds = catchAsync(async (req, res, next) => {
  const uploadsUser = await User.findOne({ username: req.params.username });
  if (!uploadsUser) {
    return next(new AppError('User not found', 404));
  }
  const upload = await Upload.findOne({
    user: uploadsUser._id,
    slug: req.params.slug,
  });
  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }
  req.body.upload = upload._id;
  req.body.user = req.user.id;
  next();
});

// Validate parentComment if provided
exports.giveComment = catchAsync(async (req, res, next) => {
  const { content, parentComment } = req.body;

  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      return next(new AppError('Parent comment not found', 404));
    }
    if (parent.upload.toString() !== req.body.upload.toString()) {
      return next(
        new AppError('Parent comment does not belong to this upload', 400)
      );
    }
    // Check nesting level
    let depth = 0;
    let current = parent;
    while (current.parentComment && depth < 3) {
      current = await Comment.findById(current.parentComment);
      depth++;
    }
    if (depth >= 2) {
      return next(
        new AppError('Maximum reply nesting level reached (3 levels)', 400)
      );
    }
  }

  const comment = await Comment.create({
    content,
    user: req.body.user,
    upload: req.body.upload,
    parentComment: parentComment || null,
  });

  res.status(201).json({
    status: 'success',
    data: {
      data: comment,
    },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }
  if (comment.user.toString() !== req.user.id) {
    return next(new AppError('You can only edit your own comments', 403));
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    { content: req.body.content, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      data: updatedComment,
    },
  });
});

exports.deleteMyComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }
  if (comment.user.id !== req.user.id) {
    console.log(comment.user._id + ': !!!!!!!! :' + req.user.id);
    return next(new AppError('You can only delete your own comments', 403));
  }

  await comment.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllComments = factory.getAllDocs(Comment);
exports.getComment = factory.getDoc(Comment);
exports.updateComment = factory.updateDoc(Comment);
exports.deleteComment = factory.deleteDoc(Comment);
