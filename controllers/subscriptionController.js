const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Subscribe to a user
exports.subscribe = catchAsync(async (req, res, next) => {
  const userToSubscribe = await User.findById(req.params.userId);
  if (!userToSubscribe) {
    return next(new AppError('User not found', 404));
  }

  const currentUser = req.user;

  if (userToSubscribe._id.toString() === currentUser._id.toString()) {
    return next(new AppError('You cannot subscribe to yourself', 400));
  }

  // Add the subscription
  if (!userToSubscribe.subscribers.includes(currentUser._id)) {
    userToSubscribe.subscribers.push(currentUser._id);
    await userToSubscribe.save({ validateBeforeSave: false });

    // Add to the current user's subscriptions
    if (!currentUser.subscriptions.includes(userToSubscribe._id)) {
      currentUser.subscriptions.push(userToSubscribe._id);
      await currentUser.save({ validateBeforeSave: false });
    }

    // Create a notification for the subscribed user
    await Notification.create({
      user: userToSubscribe._id,
      type: 'subscription',
      fromUser: currentUser._id,
    });
  }

  res.status(200).json({
    status: 'success',
    message: `Subscribed to ${userToSubscribe.username}`,
  });
});

// Unsubscribe from a user
exports.unsubscribe = catchAsync(async (req, res, next) => {
  const userToUnsubscribe = await User.findById(req.params.userId);
  if (!userToUnsubscribe) {
    return next(new AppError('User not found', 404));
  }

  const currentUser = req.user;

  // Remove the subscription
  userToUnsubscribe.subscribers = userToUnsubscribe.subscribers.filter(
    (id) => id.toString() !== currentUser._id.toString()
  );
  await userToUnsubscribe.save({ validateBeforeSave: false });

  currentUser.subscriptions = currentUser.subscriptions.filter(
    (id) => id.toString() !== userToUnsubscribe._id.toString()
  );
  await currentUser.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Unsubscribed from ${userToUnsubscribe.username}`,
  });
});
