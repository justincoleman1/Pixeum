const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');

const router = express.Router();

// Google OAuth Routes
router.get(
  '/',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallbackHandler
);

router.post('/callback', authController.googleCallbackPost);

module.exports = router;
