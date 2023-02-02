const Comment = require('../models/commentModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

exports.setCommentUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.upload) req.body.upload = req.params.uploadId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllComments = factory.getAllDocs(Comment);
exports.getComment = factory.getDoc(Comment);
exports.giveComment = factory.createDoc(Comment);
exports.updateComment = factory.updateDoc(Comment);
exports.deleteComment = factory.deleteDoc(Comment);
