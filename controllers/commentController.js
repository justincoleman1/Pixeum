const catchAsync = require('../utils/catchAsync');
const Comment = require('../models/commentModel');
const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multerController = require('./multerCommentController');
const sharp = require('sharp');
const fs = require('fs').promises;

exports.setCommentUserIds = catchAsync(async (req, res, next) => {
  console.log(
    'setCommentUserIds - Username:',
    req.params.username,
    'Slug:',
    req.params.slug
  );
  const uploadsUser = await User.findOne({ username: req.params.username });
  if (!uploadsUser) {
    console.log('User not found:', req.params.username);
    return next(new AppError('User not found', 404));
  }
  const upload = await Upload.findOne({
    user: uploadsUser._id,
    slug: req.params.slug,
  });
  if (!upload) {
    console.log('Upload not found:', req.params.slug);
    return next(new AppError('Upload not found', 404));
  }
  req.uploadId = upload._id;
  req.body.user = req.user.id;
  console.log(
    'setCommentUserIds - Upload ID:',
    req.uploadId,
    'User ID:',
    req.body.user
  );
  next();
});

exports.resizeCommentImage = catchAsync(async (req, res, next) => {
  console.log('Resize Comment Image Middleware');
  if (!req.files || req.files.length === 0) {
    console.log('No files present...Skipping');
    return next();
  }

  // Parse the elements array from req.body
  const elements = JSON.parse(req.body.elements || '[]');
  let mediaIndex = 0;

  // Iterate through elements to find media items
  for (let element of elements) {
    if (element.type === 'image' || element.type === 'gif') {
      // Find the corresponding file in req.files
      const file = req.files.find((f) => f.fieldname === `media-${mediaIndex}`);
      if (!file) {
        return next(new AppError('Media file mismatch', 400));
      }

      // Resize only images, skip GIFs
      if (element.type === 'gif') {
        console.log('GIF detected, skipping resize...');
      } else {
        const maxWidth = 300;
        await sharp(`public/img/stock/${file.filename}`)
          .resize({
            fit: sharp.fit.contain,
            width: maxWidth,
          })
          .jpeg({ quality: 90 })
          .toFile(`public/img/stock/temp-${file.filename}`);

        await fs.rename(
          `public/img/stock/temp-${file.filename}`,
          `public/img/stock/${file.filename}`
        );
      }
      mediaIndex++;
    } else if (element.type === 'excel') {
      // Excel files are not resized, but increment the media index
      mediaIndex++;
    }
  }

  console.log('Ending Resize Comment Image Middleware');
  next();
});

exports.giveComment = catchAsync(async (req, res, next) => {
  multerController.uploadCommentMedia(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }

    const { elements, parentComment } = req.body; // Initialize parentComment from req.body

    if (!elements) {
      return next(new AppError('Elements array is required', 400));
    }

    const parsedElements = JSON.parse(elements);
    if (!Array.isArray(parsedElements)) {
      return next(new AppError('Elements must be an array', 400));
    }

    // Check for nested comment depth if parentComment exists
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
      user: req.user.id,
      upload: req.uploadId,
      parentComment: parentComment || null,
    };

    console.log('commentData:', commentData);
    // Process elements and map media files
    let mediaIndex = 0;
    for (let element of parsedElements) {
      if (element.type === 'text') {
        commentData.elements.push({
          type: 'text',
          value: element.value,
        });
      } else if (element.type === 'image' || element.type === 'gif') {
        const file = req.files.find(
          (f) => f.fieldname === `media-${mediaIndex}`
        );
        if (!file) {
          return next(new AppError('Media file mismatch', 400));
        }
        commentData.elements.push({
          type: element.type,
          value: `/img/stock/${file.filename}`,
        });
        mediaIndex++;
      } else if (element.type === 'excel') {
        const file = req.files.find(
          (f) => f.fieldname === `media-${mediaIndex}`
        );
        if (!file) {
          return next(new AppError('Media file mismatch', 400));
        }
        commentData.elements.push({
          type: 'excel',
          value: element.value, // CSV content or filename
        });
        mediaIndex++;
      }
    }

    console.log('about to create comment');
    console.log('commentData:', commentData);

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
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const userId = req.user.id;
  const alreadyLiked = comment.likedBy.includes(userId);
  const alreadyDisliked = comment.dislikedBy.includes(userId);

  if (alreadyLiked) {
    comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
    comment.like_count = Math.max(comment.like_count - 1, 0);
  } else {
    comment.likedBy.push(userId);
    comment.like_count += 1;
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
  const alreadyDisliked = comment.dislikedBy.includes(userId);
  const alreadyLiked = comment.likedBy.includes(userId);

  if (alreadyDisliked) {
    comment.dislikedBy = comment.dislikedBy.filter(
      (id) => id.toString() !== userId
    );
    comment.dislike_count = Math.max(comment.dislike_count - 1, 0);
  } else {
    comment.dislikedBy.push(userId);
    comment.dislike_count += 1;
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

  if (comment.user.toString() !== req.user.id) {
    return next(new AppError('You can only update your own comments', 403));
  }

  const { elements } = req.body;

  if (!elements || !Array.isArray(elements)) {
    return next(new AppError('Elements array is required', 400));
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    { elements },
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
  const softDeleteThreshold = 24 * 60 * 60 * 1000;

  if (ageInMs >= softDeleteThreshold) {
    await comment.softDelete();
  } else {
    await comment.deleteOne();
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllComments = factory.getAllDocs(Comment);
exports.getComment = factory.getDoc(Comment);
