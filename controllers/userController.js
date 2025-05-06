// Import necessary modules and models
const sharp = require('sharp');
const Handler = require('./handlerFactory');
const { upload } = require('./multerController');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Middleware to upload a user photo
exports.uploadUserPhoto = upload.single('photo');

// Middleware to resize a user photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Set the filename for the resized photo
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  // Resize the photo and save it to the public folder
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// Function to filter an object based on allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware to get the user with the current token
exports.getMe = (req, res, next) => {
  console.log('populating req params with id...');
  req.params.id = req.user._id;
  next();
};

// Middleware to update the current user's profile
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    // If the request body contains password fields, return an error
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // Filter the request body based on allowed fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'username',
    'birthday',
    'gender',
    'email'
  );
  if (req.file) filteredBody.photo = req.file.filename;

  // Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // Send a response with the updated user data
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Middleware to delete the current user's account
exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  // Find the user by ID and select the password field
  const user = await User.findById({ _id: req.user._id }).select('+password');

  if (!user) return next(new AppError('User not found!', 400));

  // Check if the posted passwords match
  if (req.body.password !== req.body.passwordConfirm)
    return next(new AppError('Passwords do not match!', 400));

  // Check if the current password is correct
  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError('Incorrect Password!', 401));

  // Set the user account to inactive
  await User.findByIdAndUpdate(req.user._id, { active: false });

  // Send a success response with null data

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});

// Handlers for user documents
exports.getAllUsers = Handler.getAllDocs(User);
exports.createUser = Handler.createDoc(User);
exports.getUser = Handler.getDoc(User);
exports.deleteUser = Handler.deleteDoc(User);
