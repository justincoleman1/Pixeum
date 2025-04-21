const Upload = require('../models/uploadModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.trackViews = catchAsync(async (req, res, next) => {
  const upload = req.upload;
  if (upload) {
    const viewedUploads = req.session.viewedUploads || {};
    const lastVisit = viewedUploads[upload._id];
    const currentTime = new Date().getTime();

    if (!lastVisit || currentTime - lastVisit > 3600000) {
      upload.view_count += 1;
      await upload.save();

      viewedUploads[upload._id] = currentTime;
      req.session.viewedUploads = viewedUploads;
    }
  }
  req.upload = upload;
  next();
});
