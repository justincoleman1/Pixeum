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

// Route to handle reactions (requires authentication)
router.post(
  '/:username/:slug/reactions',
  authController.protect,
  authController.restrictTo('user'),
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
