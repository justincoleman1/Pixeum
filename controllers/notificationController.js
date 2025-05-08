const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a notification
exports.createNotification = catchAsync(async (req, res, next) => {
  const { user, type, fromUser, comment, upload } = req.body;

  const notification = await Notification.create({
    user,
    type,
    fromUser,
    comment,
    upload,
  });

  res.status(201).json({
    status: 'success',
    data: {
      notification,
    },
  });
});

// Get all notifications for the logged-in user
exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id }).sort(
    '-createdAt'
  );

  res.status(200).json({
    status: 'success',
    data: {
      notifications,
    },
  });
});

// Get the count of unseen notifications
exports.getUnseenNotificationCount = catchAsync(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    seen: false,
  });

  res.status(200).json({
    status: 'success',
    data: {
      count,
    },
  });
});

// Mark a notification as seen
exports.markNotificationAsSeen = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError('You are not authorized to view this notification', 403)
    );
  }

  notification.seen = true;
  await notification.save();

  res.status(200).json({
    status: 'success',
    data: {
      notification,
    },
  });
});

// Mark all notifications as seen
exports.markAllNotificationsAsSeen = catchAsync(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, seen: false },
    { seen: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as seen',
  });
});
