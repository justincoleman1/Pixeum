// routes/commentRoutes.js
const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .post(commentController.setCommentUserIds, commentController.giveComment);

router
  .route('/:id')
  .patch(commentController.updateComment)
  .delete(commentController.deleteMyComment);

module.exports = router;
