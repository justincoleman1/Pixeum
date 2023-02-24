const fs = require('fs');
const Handler = require('./handlerFactory');
const AppError = require('../utils/appError');
const Upload = require('../models/uploadModel');
const Tag = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const { upload } = require('./multerController');
const sharp = require('sharp');
const { makeid } = require('../utils/makeId');
const { formatBytes } = require('../utils/formatBytes');

exports.setUploadUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.uploadMain = upload.single('media');

//Image Display Options
//Original Image --------------Downloads,Upload's Page Main Image Display
exports.rawUploadedImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.body.filename = `${makeid(5)}` + `-${req.user._id}-${Date.now()}.jpeg`;
  req.file.filename = req.body.filename;

  const { data, info } = await sharp(req.file.buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelArray = new Uint8ClampedArray(data.buffer);
  const { width, height, channels } = info;
  await sharp(pixelArray, { raw: { width, height, channels } }).toFile(
    `public/img/stock/raw-${req.file.filename}`
  );
  next();
});

exports.resizedUploadedImage = catchAsync(async (req, res, next) => {
  // console.log('FILE?', req.file);
  if (!req.file) return next();

  req.file.filename = req.body.filename;

  const imageBuffer = req.file.buffer;

  const imageWidth =
    req.body.width !== 'original' ? parseInt(req.body.width) : null;

  const processImage = async () => {
    await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toFile(`public/img/stock/${req.file.filename}`);

    const rIB = await fs.promises.readFile(
      `public/img/stock/${req.file.filename}`
    );
    const metadata = await sharp(rIB).metadata();

    req.body.buffer = metadata.buffer;
    req.body.size = metadata.size;
    req.body.width = metadata.width;
    req.body.height = metadata.height;
    req.body.format = metadata.format;
  };

  if (imageWidth !== null) {
    await sharp(imageBuffer)
      .resize({
        fit: sharp.fit.contain,
        width: imageWidth,
      })
      .jpeg({ quality: 90 })
      .toFile(`public/img/stock/${req.file.filename}`);

    try {
      await processImage();
    } catch (error) {
      return next(AppError(error.message, 500));
    }
  } else {
    try {
      await processImage();
    } catch (error) {
      return next(AppError(error.message, 500));
    }
  }

  next();
});

exports.createUpload = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'title',
    'description',
    'tags',
    'maturity'
  );

  if (req.file) {
    filteredBody.media = req.file.filename;
    filteredBody.mimetype = req.file.mimetype.split('/')[0];
    filteredBody.size = formatBytes(req.body.size);

    filteredBody.buffer = req.body.buffer;
    filteredBody.width = req.body.width;
    filteredBody.height = req.body.height;
    filteredBody.format = req.body.format;
  }

  filteredBody.user = req.user._id;

  const newUpload = await Upload.create(filteredBody);

  if (filteredBody.tags) {
    filteredBody.tags.forEach(
      catchAsync(async function (tag) {
        if (filteredBody.maturity) {
          if (
            await Tag.exists({ name: tag, maturity: filteredBody.maturity[0] })
          ) {
            await Tag.findOneAndUpdate(
              { name: tag, maturity: filteredBody.maturity[0] },
              { $inc: { count: 1 } }
            );
          } else {
            await Tag.create({ name: tag, maturity: filteredBody.maturity[0] });
          }
        } else {
          if (await Tag.exists({ name: tag })) {
            await Tag.findOneAndUpdate({ name: tag }, { $inc: { count: 1 } });
          } else {
            //create new tag
            await Tag.create({ name: tag });
          }
        }
      })
    );
  }

  res.status(200).json({
    status: 'success',
  });
});

// exports.updateUpload = catchAsync(async (req, res, next) => {
//   const newUpload = await Upload.findByIdAndUpdate(req.upload._id, {
//     media_type: req.body.media_type,
//     title: req.body.title,
//     description: req.body.description,
//     tags: req.body.tags,
//     maturity: req.body.maturity,
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       upload: newUpload,
//     },
//   });
// });

exports.getAllUploads = Handler.getAllDocs(Upload);
exports.getUpload = Handler.getDoc(Upload, { path: 'comments' });
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
