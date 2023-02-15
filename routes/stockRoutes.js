const express = require('express');

// const commentRouter = require('./commentRoutes');

const router = express.Router();

// router.use('/:userId/comments', commentRouter);

router.param('id', (req, res, next, val) => {
  // console.log(`User id is: ${val}`);
  next();
});

module.exports = router;
