const Upload = require('../models/uploadModel');
const Tags = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverviewPage = catchAsync(async (req, res, next) => {
  //1) Get upload data from collection
  const images = await Upload.find({ mimetype: 'image' });
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
  const upload = await Upload.findOne({ slug: req.params.slug }).populate({
    path: 'comments',
    fields: 'comment rating user',
  });

  if (!upload)
    return next(new AppError('There is no upload with that name.', 404));

  res.status(200).render('upload', {
    title: `${upload.name} Upload`,
    upload,
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
