// controllers/commentController.js
const catchAsync = require('../utils/catchAsync');
const Comment = require('../models/commentModel');
const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multerCommentController = require('./multerCommentController');
const sharp = require('sharp');
const fs = require('fs').promises;

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

// Middleware to resize comment images
exports.resizeCommentImage = catchAsync(async (req, res, next) => {
  console.log('Resize Comment Image Middleware');
  if (!req.file) {
    console.log('No file present...Skipping');
    return next();
  }

  // Skip resizing for GIFs to preserve animation
  if (req.file.mimetype === 'image/gif') {
    console.log('GIF detected, skipping resize...');
    return next();
  }

  // Resize images to a max width of 300px
  const maxWidth = 300;
  await sharp(`public/img/stock/${req.file.filename}`)
    .resize({
      fit: sharp.fit.contain,
      width: maxWidth,
    })
    .jpeg({ quality: 90 })
    .toFile(`public/img/stock/temp-${req.file.filename}`);

  // Replace the original file with the resized one
  await fs.rename(
    `public/img/stock/temp-${req.file.filename}`,
    `public/img/stock/${req.file.filename}`
  );

  console.log('Ending Resize Comment Image Middleware');
  next();
});

// Validate parentComment if provided
exports.giveComment = catchAsync(async (req, res, next) => {
  //Handle file upload using the centralized Multer middleware
  multerCommentController.uploadCommentMedia(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }
    const { elements, parentComment } = req.body;

    if (!elements || !Array.isArray(elements)) {
      return next(new AppError('Elements array is required', 400));
    }

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

    const commentData = {
      elements: [],
      user: req.body.user,
      upload: req.body.upload,
      parentComment: parentComment || null,
    };

    let mediaIndex = 0;
    for (let element of elements) {
      if (element.type === 'text') {
        commentData.elements.push({
          type: 'text',
          value: element.value,
        });
      } else if (element.type === 'image' || element.type === 'gif') {
        if (mediaIndex >= req.files.length) {
          return next(new AppError('Media file mismatch', 400));
        }
        const file = req.files[mediaIndex];
        commentData.elements.push({
          type: element.type,
          value: `/img/stock/${file.filename}`,
        });
        mediaIndex++;
      }
    }
    const comment = await Comment.create(commentData);
    res.status(201).json({
      status: 'success',
      data: {
        data: comment,
      },
    });
  });
});

exports.likeComment = catchAsync(async (req, res, next) => {
  console.log('HERE');
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const userId = req.user.id;
  const alreadyLiked = comment.likedBy.includes(userId);
  const alreadyDisliked = comment.dislikedBy.includes(userId);

  if (alreadyLiked) {
    // Undo upvote
    comment.likedBy = comment.dislikedBy.filter(
      (id) => id.toString() !== userId
    );
    comment.like_count = Math.max(comment.like_count - 1, 0);
  } else {
    // Add upvote
    comment.likedBy.push(userId);
    comment.like_count += 1;
    // If user previously downvoted, remove the downvote
    if (alreadyDisliked) {
      comment.dislikedBy = comment.dislikedBy.filter(
        (id) => id.toString() !== userId
      );
      comment.dislike_count = Math.max(comment.dislike_count - 1, 0);
    }
  }

  await comment.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      like_count: comment.like_count,
      dislike_count: comment.dislike_count,
      liked: !alreadyLiked,
      disliked: false,
    },
  });
});

exports.dislikeComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const userId = req.user.id;
  const alreadyDisliked = comment.dislikedBy.includes(userId); // Updated from downvotedBy
  const alreadyLiked = comment.likedBy.includes(userId); // Updated from upvotedBy

  if (alreadyDisliked) {
    // Undo downvote
    comment.dislikedBy = comment.dislikedBy.filter(
      (id) => id.toString() !== userId
    );
    comment.dislike_count = Math.max(comment.dislike_count - 1, 0);
  } else {
    // Add downvote
    comment.dislikedBy.push(userId);
    comment.dislike_count += 1;
    // If user previously upvoted, remove the upvote
    if (alreadyLiked) {
      comment.likedBy = comment.likedBy.filter(
        (id) => id.toString() !== userId
      );
      comment.like_count = Math.max(comment.like_count - 1, 0);
    }
  }

  await comment.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      like_count: comment.like_count,
      dislike_count: comment.dislike_count,
      liked: false,
      disliked: !alreadyDisliked,
    },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }
  if (comment.user.id.toString() !== req.user.id) {
    return next(new AppError('You can only edit your own comments', 403));
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    { content: req.body.content, isEdited: true, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedComment,
    },
  });
});

exports.deleteMyComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate('user');
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }
  console.log(
    'Comment user ID:',
    comment.user.id,
    'Request user ID:',
    req.user.id
  );
  if (comment.user.id !== req.user.id) {
    return next(new AppError('You can only delete your own comments', 403));
  }

  const ageInMs = Date.now() - comment.createdAt.getTime();
  const softDeleteThreshold = 60 * 1000; // 24 hours in milliseconds 24 60 60 1000 - 1min 60* 1000

  if (ageInMs >= softDeleteThreshold) {
    // Soft delete
    await comment.softDelete();
  } else {
    // Hard delete
    await comment.deleteOne();
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllComments = factory.getAllDocs(Comment);
exports.getComment = factory.getDoc(Comment);
exports.deleteComment = factory.deleteDoc(Comment);
