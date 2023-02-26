const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const Tags = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { timeAgo2 } = require('../utils/timeAgo');

exports.getHomePage = catchAsync(async (req, res, next) => {
  //1) Get upload data from collection
  const images = await Upload.find({ mimetype: 'image' }).populate({
    path: 'users',
    fields: 'username',
  });
  //2) Get most used tags
  const tags = await Tags.find().limit(20);
  //2) Build Template
  //3) Render that template using upload data from 1)
  res.status(200).render('home', {
    title: 'All Uploads',
    images,
    tags,
  });
});

exports.getUploadForm = (req, res) => {
  res.status(200).render('submission', {
    title: 'Upload your work',
  });
};

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
  console.log(upload.createdAt);

  const date = timeAgo2(upload.createdAt);

  res.status(200).render('uploadpage', {
    title: `${upload.title}`,
    upload,
    date,
    recents,
  });
});

exports.getUpdateUploadForm = catchAsync(async (req, res) => {
  //Get the slug of the upload we want to update
  const slug = req.params.slug;

  // find the upload to be updated
  const upload = await Upload.findOne({
    user: req.user._id,
    slug: slug,
  });

  // check if the user is the owner of the upload
  if (!upload || upload.user.id !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this upload.', 403)
    );
  }
  res.status(200).render('update-submission', {
    title: 'Update your work',
    upload: upload,
  });
});

exports.getUserProfile = (req, res, next) => {
  res.status(200).render('profile', {
    title: 'Profile page',
  });
};

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
