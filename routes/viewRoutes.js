const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverviewPage);

router.get('/login', viewController.getLoginForm);

router.get('/signup', viewController.getSignUpForm);

router.get('/me', authController.protect, viewController.getAccount);

router.get('/submission', authController.protect, viewController.getUploadForm);

router.get('/upload/:slug', viewController.getUploadPage);

module.exports = router;
