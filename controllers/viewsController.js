const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const Tags = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const TimeAgo = require('javascript-time-ago');
const en = require('javascript-time-ago/locale/en');

TimeAgo.addDefaultLocale(en);

// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

timeAgo.format(new Date());
// "just now"

timeAgo.format(Date.now() - 60 * 1000);
// "1 minute ago"

timeAgo.format(Date.now() - 2 * 60 * 60 * 1000);
// "2 hours ago"

timeAgo.format(Date.now() - 24 * 60 * 60 * 1000);
// "1 day ago"

exports.getOverviewPage = catchAsync(async (req, res, next) => {
  //1) Get upload data from collection
  const images = await Upload.find({ mimetype: 'image' }).populate({
    path: 'users',
    fields: 'username',
  });
  //2) Get most used tags
  const tags = await Tags.find({ maturity: 'everyone' }).limit(20);
  //2) Build Template
  //3) Render that template using upload data from 1)
  res.status(200).render('overview', {
    title: 'All Uploads',
    images,
    tags,
  });
});

exports.getUploadPage = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });
  const upload = await Upload.findOne({
    user: user._id,
    slug: req.params.slug,
  }).populate({
    path: 'user',
    fields: 'username photo',
  });
  const recents = await Upload.find({ user: user._id, mimetype: 'image' })
    .where('slug')
    .ne(req.params.slug)
    .limit(9);

  if (!upload)
    return next(new AppError('There is no upload with that name.', 404));

  const date = timeAgo.format(upload.createdAt - 2 * 60 * 60 * 1000);

  res.status(200).render('uploadpage', {
    title: `${upload.title}`,
    upload,
    date,
    recents,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignUpForm = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Create an account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getUploadForm = (req, res) => {
  res.status(200).render('submission', {
    title: 'Upload your work',
  });
};

// exports.getMyUploads = catchAsync(async (req, res, next) => {
//   //1) Find all uploads
//   const uploads = await Upload.find({ user: req.user._id }).populate('uploads');
//   if (!uploads) {
//     res.status(200).render('overview', {
//       title: 'My uploads',
//       uploads: [],
//     });
//   }
//   //2) Find uploads with the returned IDs
//   const uploadIDs = bookings.map((el) => el.upload);
//   const uploads = await Upload.find({ _id: { $in: uploadIDs } });
//   res.status(200).render('overview', {
//     title: 'My uploads',
//     uploads,
//   });
// });
