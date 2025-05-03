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
      // Skip URL-based media or existing media
      if (element.source === 'url') {
        console.log(`Skipping URL-based media: ${element.value}`);
        continue;
      }
      if (element.isExisting) {
        console.log(`Skipping existing media: ${element.value}`);
        continue;
      }

      // Find the corresponding file in req.files for uploaded media
      const file = req.files.find((f) => f.fieldname === `media-${mediaIndex}`);
      if (!file) {
        return next(new AppError('Media file mismatch', 400));
      }

      console.log(`Processing media-${mediaIndex}:`, file);

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
        console.log(`Resized image to public/img/stock/${file.filename}`);
      }
      mediaIndex++;
    } else if (element.type === 'excel') {
      // Excel files are not resized, but increment the media index for uploaded media
      if (element.source === 'url') {
        console.log(`Skipping URL-based Excel: ${element.value}`);
        continue;
      }
      if (!element.isExisting) {
        const file = req.files.find(
          (f) => f.fieldname === `media-${mediaIndex}`
        );
        if (!file) {
          return next(new AppError('Media file mismatch', 400));
        }
        console.log(`Processing Excel media-${mediaIndex}:`, file);
        mediaIndex++;
      }
    }
  }

  console.log('Ending Resize Comment Image Middleware');
  next();
});

exports.giveComment = catchAsync(async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      multerController.uploadCommentMedia(req, res, (err) => {
        if (err) {
          return reject(new AppError(err.message, 400));
        }
        resolve();
      });
    });

    const { elements, parentComment } = req.body;

    if (!elements) {
      return next(new AppError('Elements array is required', 400));
    }

    const parsedElements = JSON.parse(elements);
    if (!Array.isArray(parsedElements)) {
      return next(new AppError('Elements must be an array', 400));
    }

    const commentData = {
      elements: [],
      user: req.user.id,
      upload: req.uploadId,
    };

    if (parentComment) {
      commentData.parentComment = parentComment;
    }

    let mediaIndex = 0;
    for (let element of parsedElements) {
      if (element.type === 'text') {
        commentData.elements.push({
          type: 'text',
          value: element.value,
        });
      } else if (element.type === 'image' || element.type === 'gif') {
        if (element.source === 'url') {
          // URL-based media: use the value directly
          commentData.elements.push({
            type: element.type,
            value: element.value,
          });
        } else if (element.isExisting) {
          // Existing media: use the value directly
          commentData.elements.push({
            type: element.type,
            value: element.value,
          });
        } else {
          // Uploaded media: expect a file
          const file = req.files.find(
            (f) => f.fieldname === `media-${mediaIndex}`
          );
          if (!file) {
            return next(
              new AppError('Media file mismatch for new upload', 400)
            );
          }
          console.log(`Processing new media at media-${mediaIndex}:`, file);
          commentData.elements.push({
            type: element.type,
            value: `/img/stock/${file.filename}`,
          });
          mediaIndex++;
        }
      } else if (element.type === 'excel') {
        if (element.source === 'url') {
          // URL-based Excel data (unlikely, but handle for completeness)
          commentData.elements.push({
            type: 'excel',
            value: element.value,
          });
        } else if (element.isExisting) {
          // Existing Excel data
          commentData.elements.push({
            type: 'excel',
            value: element.value,
          });
        } else {
          // Uploaded Excel
          const file = req.files.find(
            (f) => f.fieldname === `media-${mediaIndex}`
          );
          if (!file) {
            return next(
              new AppError('Media file mismatch for new upload', 400)
            );
          }
          console.log(`Processing new Excel at media-${mediaIndex}:`, file);
          commentData.elements.push({
            type: 'excel',
            value: element.value,
          });
          mediaIndex++;
        }
      }
    }

    console.log('Comment data before saving:', commentData);

    const comment = await Comment.create(commentData);

    res.status(201).json({
      status: 'success',
      data: {
        data: comment,
      },
    });
  } catch (err) {
    next(err);
  }
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
  try {
    await new Promise((resolve, reject) => {
      multerController.uploadCommentMedia(req, res, (err) => {
        if (err) {
          return reject(new AppError(err.message, 400));
        }
        resolve();
      });
    });

    const { elements } = req.body;

    if (!elements) {
      return next(new AppError('Elements array is required', 400));
    }

    const parsedElements = JSON.parse(elements);
    if (!Array.isArray(parsedElements)) {
      return next(new AppError('Elements must be an array', 400));
    }

    const commentData = {
      elements: [],
      isEdited: true,
      updatedAt: Date.now(),
    };

    let mediaIndex = 0;
    for (let element of parsedElements) {
      if (element.type === 'text') {
        commentData.elements.push({
          type: 'text',
          value: element.value,
        });
      } else if (element.type === 'image' || element.type === 'gif') {
        if (element.source === 'url') {
          // URL-based media: use the value directly
          commentData.elements.push({
            type: element.type,
            value: element.value,
          });
        } else if (element.isExisting) {
          // Existing media, use the original value
          commentData.elements.push({
            type: element.type,
            value: element.value,
          });
        } else {
          // New media upload
          const file = req.files.find(
            (f) => f.fieldname === `media-${mediaIndex}`
          );
          if (!file) {
            return next(
              new AppError('Media file mismatch for new upload', 400)
            );
          }
          console.log(`Processing new media at media-${mediaIndex}:`, file);
          commentData.elements.push({
            type: element.type,
            value: `/img/stock/${file.filename}`,
          });
          mediaIndex++;
        }
      } else if (element.type === 'excel') {
        if (element.isExisting) {
          // Existing Excel data
          commentData.elements.push({
            type: 'excel',
            value: element.value,
          });
        } else {
          // New Excel upload
          const file = req.files.find(
            (f) => f.fieldname === `media-${mediaIndex}`
          );
          if (!file) {
            return next(
              new AppError('Media file mismatch for new upload', 400)
            );
          }
          console.log(`Processing new Excel at media-${mediaIndex}:`, file);
          commentData.elements.push({
            type: 'excel',
            value: element.value,
          });
          mediaIndex++;
        }
      }
    }

    console.log('Updated commentData.elements:', commentData.elements);

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      commentData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: comment,
      },
    });
  } catch (err) {
    next(err);
  }
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
