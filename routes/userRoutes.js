const express = require('express');
const passport = require('passport');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
// const commentRouter = require('./commentRoutes');
const uploadRouter = require('./uploadRoutes');

const router = express.Router();

router.use('/:userId/uploads/:slug', uploadRouter);
// router.use('/:userId/comments', commentRouter);

router.param('id', (req, res, next, val) => {
  // console.log(`User id is: ${val}`);
  next();
});
//User Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Google OAuth Routes
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallbackHandler
);

router.post('/auth/google/callback', authController.googleCallbackPost);

router.use(authController.protect);
//EVERY ROUTE UNDER THIS LINE WILL BE PROTECTED -------------------------------------------
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.delete('/delete-my-account', userController.deleteMyAccount);

router.use(authController.restrictTo('admin'));
//All Routes Below are only accessible by admins ---------------------------------------
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser);

module.exports = router;
