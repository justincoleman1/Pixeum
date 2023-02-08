const Handler = require('./handlerFactory');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { upload } = require('./multerController');
const sharp = require('sharp');

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.getAllUsers = Handler.getAllDocs(User);
exports.createUser = Handler.createDoc(User);
exports.getUser = Handler.getDoc(User);
exports.deleteUser = Handler.deleteDoc(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'username',
    'birthday',
    'gender',
    'email'
  );
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById({ _id: req.user._id }).select('+password');
  //2) Check if posted current password is correctJust don't forget who has the sack bro
  if (!user) return next(new AppError('User not found!', 400));

  if (req.body.password !== req.body.passwordConfirm)
    return next(new AppError('Passwords do not match!', 400));

  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError('Incorrect Password!', 401));

  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});

exports.deleteUser = Handler.deleteDoc(User);
