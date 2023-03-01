const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use(viewController.alerts);

router.use(authController.isLoggedIn);

router.get('/', viewController.getHomePage);

router.get('/login', viewController.getLoginForm);

router.get('/signup', viewController.getSignUpForm);

router.get('/me', authController.protect, viewController.getAccount);

router.get('/submission', authController.protect, viewController.getUploadForm);

router.get('/:username', viewController.getUserProfile);

router.get('/:username/:slug', viewController.getUploadPage);

router.get('/me', authController.protect, viewController.getAccount);

router.get('/submission', authController.protect, viewController.getUploadForm);

router.get(
  '/:username/:slug/update',
  authController.protect,
  viewController.getUpdateUploadForm
);

module.exports = router;
