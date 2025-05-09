const User = require('../models/userModel');
const Upload = require('../models/uploadModel');
const Tags = require('../models/tagModel');
const Favorite = require('../models/favoriteModel');
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
  const tags = await Tags.find();
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

// controllers/viewsController.js
exports.getUploadPage = catchAsync(async (req, res, next) => {
  const user = req.uploadsUser;
  const upload = req.upload;

  const recents = await Upload.find({ user: user._id, mimetype: 'image' })
    .where('slug')
    .ne(req.params.slug)
    .limit(9);

  if (!upload) {
    return next(new AppError('There is no upload with that name.', 404));
  }

  const date = timeAgo2(upload.createdAt);

  res.status(200).render('uploadpage', {
    title: `${upload.title}`,
    upload,
    date,
    recents,
    isFavorited: JSON.stringify(req.isFavorited),
    timeAgo: timeAgo2,
    tenorApiKey: process.env.TENOR_API_KEY,
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
    uploadData: JSON.stringify(upload), // add the upload data as a JSON string
  });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const pageOwner = await User.findOne({ username: req.params.username });
  res.status(200).render('profile', {
    title: 'Profile page',
    pageOwner: pageOwner,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
    googleClientId: process.env.GOOGLE_CLIENT_ID, // Pass GOOGLE_CLIENT_ID to the template
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

// Handler to render the mycomments page
exports.getMyCommentsPage = (req, res) => {
  res.status(200).render('mycomments', {
    title: 'My Comments',
    comments: req.comments,
    timeAgo: timeAgo2,
    tenorApiKey: process.env.TENOR_API_KEY,
  });
};
