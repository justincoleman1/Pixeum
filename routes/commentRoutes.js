// routes/commentRoutes.js
const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(commentController.getAllComments)
  .post(
    commentController.setCommentUserIds,
    commentController.resizeCommentImage,
    commentController.giveComment
  );

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(commentController.resizeCommentImage, commentController.updateComment)
  .delete(commentController.deleteMyComment);

router.route('/:id/likeComment').post(commentController.likeComment);
router.route('/:id/dislikeComment').post(commentController.dislikeComment);

module.exports = router;
