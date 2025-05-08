const express = require('express');
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Routes for notifications
router
  .route('/')
  .post(notificationController.createNotification)
  .get(notificationController.getMyNotifications);

router.get('/unseen-count', notificationController.getUnseenNotificationCount);

router.patch('/:id/seen', notificationController.markNotificationAsSeen);
router.patch(
  '/mark-all-seen',
  notificationController.markAllNotificationsAsSeen
);

module.exports = router;
