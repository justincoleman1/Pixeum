const Handler = require('./handlerFactory');
const Upload = require('../models/uploadModel');
const catchAsync = require('../utils/catchAsync');
const { upload } = require('./multerController');
const sharp = require('sharp');

exports.setUploadUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.uploadImageCover = upload.single('imageCover');

exports.resizeImageCover = catchAsync(async (req, res, next) => {
  // console.log('FILE?', req.file);
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getAllUploads = Handler.getAllDocs(Upload);
exports.getUpload = Handler.getDoc(Upload, { path: 'comments' });
exports.createUpload = Handler.createDoc(Upload);
exports.updateUpload = Handler.updateDoc(Upload);
exports.deleteUpload = Handler.deleteDoc(Upload);

exports.getUploadStats = catchAsync(async (req, res, next) => {
  const stats = await Upload.aggregate([
    // {
    //   $match: { ratingsAverage: { $gte: 4.5 } },
    // },
    {
      $group: {
        _id: { $toUpper: '$media_type' },
        numUploads: { $sum: 1 },
        numLikes: { $sum: '$like_count' },
        avgLikes: { $avg: '$like_count' },
        numComments: { $sum: '$comment_count' },
        avgComments: { $avg: '$comment_count' },
        numSales: { $sum: '$sale_count' },
        avgSales: { $avg: '$sale_count' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
