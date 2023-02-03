const Upload = require('../models/uploadModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverviewPage = catchAsync(async (req, res, next) => {
  //1) Get upload data from collection
  const uploads = await Upload.find();

  //2) Build Template
  //3) Render that template using upload data from 1)
  res.status(200).render('overview', {
    title: 'All Uploads',
    uploads,
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

exports.getMyUploads = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user._id }).populate(
    'uploads'
  );
  if (!bookings) {
    res.status(200).render('overview', {
      title: 'My uploads',
      uploads: [],
    });
  }
  //2) Find uploads with the returned IDs
  const uploadIDs = bookings.map((el) => el.upload);
  const uploads = await Upload.find({ _id: { $in: uploadIDs } });

  res.status(200).render('overview', {
    title: 'My uploads',
    uploads,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
