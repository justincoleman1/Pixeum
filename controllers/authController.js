const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };

  console.log('HERE');
  if (process.env.NODE_ENV === 'development') cookieOptions.secure = false;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  //2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or passowrd', 401));
  }
  //3) If everythingis okay, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

//AUTHENTICATION
exports.protect = catchAsync(async (req, res, next) => {
  //1) Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    // eslint-disable-next-line no-unused-vars
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // console.log('token', token);

  if (!token) {
    return next(new AppError('Please login to access this content.', 401));
  }

  //2) Verify token
  //this promise returns a decoded payload
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3) Check if user still exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) return next(new AppError('User not found!', 401));

  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat))
    return next(
      new AppError('User recently changed password! Please login again!', 401)
    );

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

//Only for rendered pages, No Errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //1) Verify token
      //this promise returns a decoded payload
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) Check if user still exists
      const currentUser = await User.findById(decodedPayload.id);
      if (!currentUser) return next();

      //4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decodedPayload.iat)) return next();

      //There is a logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

//AUTHORIZATION
//arguments... list of roles
//return a middleware function
//Check inside the function if the list of roles include the user's role
//return error if the list of roles do not contain the user's role
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'User does not have permissions to perform this action!',
          403
        )
      );
    }
    next();
  };

exports.unauthorizedPasswordDataEntryCheck = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-password',
        400
      )
    );
  }
};

exports.unauthorizedUserAccessCheck = async (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId)
    return next(new AppError('You do not have proper permissions!', 403));
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email address
  if (!req.body.email)
    return next(new AppError('Please provide your email address!', 404));

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('User with specified email address was not found!', 404)
    );
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  console.log(resetToken);
  //3) Send the reset email to user's email
  try {
    const resetLink = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Click the link below to reset your password:\n${resetLink}\nIf you didn't forget your password, ignore this email!`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset request',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) IF token has not expired, and there is a user, set the new password
  if (!user) return next(new AppError('Invalid token!', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //3) Update changed Passsword at property for the user
  await user.save();

  //4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Given: jtwToken, currentPassword, newPassword, newPasswordConfirm
  //1) Get user from collection
  const user = await User.findById({ _id: req.user._id }).select('+password');
  //2) Check if posted current password is correctJust don't forget who has the sack bro
  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('Incorrect Password!', 401));
  }
  //3) If so, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  await user.save();
  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});
