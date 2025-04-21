const Comment = require('../models/commentModel');
const Upload = require('../models/uploadModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
// const catchAsync = require('./../utils/catchAsync');

exports.setCommentUserIds = catchAsync(async (req, res, next) => {
  const uploadsUser = await User.findOne({ username: req.params.username });
  if (!uploadsUser) {
    return next(new AppError('No user by that username', 404));
  }
  const upload = await Upload.findOne({
    user: uploadsUser._id,
    slug: req.params.slug,
  });
  if (!upload) {
    return next(new AppError('No upload found with that ID', 404));
  }
  req.body.user = req.user._id;
  req.body.upload = upload._id;
  next();
});

exports.getAllComments = factory.getAllDocs(Comment);
exports.getComment = factory.getDoc(Comment);
exports.giveComment = factory.createDoc(Comment);
exports.updateComment = factory.updateDoc(Comment);
exports.deleteComment = factory.deleteDoc(Comment);
