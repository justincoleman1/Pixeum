const Favorite = require('../models/favoriteModel');
const Upload = require('../models/uploadModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

// The setUploadUserIds middleware is used to set the req.params.userId parameter based on the user ID of the upload. This is needed for the createFavorite and deleteFavorite controllers to correctly create or delete a favorite for the specified upload.;
exports.setUploadUserIds = catchAsync(async (req, res, next) => {
  let query = Upload.findById(req.params.uploadId);

  query = query.populate({ path: 'user', select: '_id username' });

  const upload = await query;

  if (!upload) {
    return next(new AppError('No upload found with that ID', 404));
  }

  req.params.userId = upload.user._id;

  next();
});

exports.isFavorited = catchAsync(async (req, res, next) => {
  const upload = req.upload;
  if (res.locals.user) {
    let isFavorited = false;
    const favorited = await Favorite.findOne({
      user: res.locals.user.id,
      upload: upload._id,
    });
    if (favorited) isFavorited = true;
    req.isFavorited = isFavorited;
  }
  next();
});

// The createFavorite controller creates a new favorite object by using the Favorite model and passing the authenticated user ID and the uploadId parameter in the request URL.;
exports.toggleFavorite = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });

  const upload = await Upload.findOne({
    user: user._id,
    slug: req.params.slug,
  });

  const options = {
    user: req.user._id,
    upload: upload._id,
  };

  const favorite = await Favorite.findOne(options);

  if (favorite) {
    console.log('deleting favorite');
    await Favorite.findOneAndDelete(options);
  } else {
    console.log('creating favorite');
    await Favorite.create(options);
  }

  res.status(201).json({
    status: 'success',
    message: 'Successfully Toggled Favorite!',
  });
});
// These controllers respond with a JSON object indicating the status of the request and any relevant data.;
