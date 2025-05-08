const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router.post('/:userId/subscribe', subscriptionController.subscribe);
router.delete('/:userId/unsubscribe', subscriptionController.unsubscribe);

module.exports = router;
