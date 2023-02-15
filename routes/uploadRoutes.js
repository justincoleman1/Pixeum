const express = require('express');

const uploadController = require('../controllers/uploadController');
const authController = require('../controllers/authController');
const commentRouter = require('./commentRoutes');

const router = express.Router();

router.use('/:uploadId/comments', commentRouter);
// router.param('id', uploadController.checkID);

router.route('/').get(uploadController.getAllUploads);

router.post(
  '/submission',
  authController.protect,
  uploadController.uploadMain,
  uploadController.rawUploadedImage,
  uploadController.resizedUploadedImage,
  uploadController.createUpload
);
// .patch(authController.protect, uploadController.updateUpload);

router
  .route('/:id')
  .get(uploadController.getUpload)
  .patch(authController.protect, uploadController.updateUpload)
  .delete(authController.protect, uploadController.deleteUpload);
router
  .route('/upload-stats')
  .get(authController.protect, uploadController.getUploadStats);

module.exports = router;
