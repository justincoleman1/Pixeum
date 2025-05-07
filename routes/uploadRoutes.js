const express = require('express');

const uploadController = require('../controllers/uploadController');
const authController = require('../controllers/authController');
const favoriteController = require('../controllers/favoriteController');
const commentRouter = require('./commentRoutes');

const router = express.Router();

router.use('/:username/:slug/comments', commentRouter);
// router.param('id', uploadController.checkID);

router.route('/').get(uploadController.getAllUploads);

router.post(
  '/submission',
  authController.protect,
  uploadController.uploadMain,
  uploadController.checkForNudity,
  uploadController.rawUploadedImage,
  uploadController.resizedUploadedImage,
  uploadController.createUpload
);

router.patch(
  '/:username/:slug/update',
  authController.protect,
  uploadController.uploadMain,
  uploadController.checkForNudity,
  uploadController.rawUploadedImage,
  uploadController.updateResizedUploadedImage,
  uploadController.updateMyUpload
);
router
  .route('/:username/:slug/favorite')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    favoriteController.toggleFavorite
  );

// Route to get the user's reaction state for an upload (optional authentication)
router.get(
  '/:username/:slug/reaction-state',
  authController.checkIfUser,
  uploadController.getUserReactionState
);

// Route to handle reactions (optional authentication)
router.post(
  '/:username/:slug/reactions',
  authController.checkIfUser,
  uploadController.addReaction
);

router.delete(
  '/:username/:slug',
  authController.protect,
  uploadController.deleteMyUpload
);

router
  .route('/:id')
  .get(uploadController.getUpload)
  .patch(authController.protect, uploadController.updateUpload)
  .delete(authController.protect, uploadController.deleteUpload);
router
  .route('/upload-stats')
  .get(authController.protect, uploadController.getUploadStats);

module.exports = router;
