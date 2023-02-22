const Handler = require('./handlerFactory');
const Upload = require('../models/uploadModel');
const Tag = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const { upload } = require('./multerController');
const sharp = require('sharp');

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

const makeid = (length) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
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
  console.log('end raw');
  next();
});

//Resized Image
exports.resizedUploadedImage = catchAsync(async (req, res, next) => {
  // console.log('FILE?', req.file);
  if (!req.file) return next();

  req.file.filename = req.body.filename;
  //pixel sizes for display 400, 600, 800, 900, 1024, 1280, 1600, 1920
  await sharp(req.file.buffer)
    .resize({
      // width: req.body.pixelSize,
      // height: 270,
      // width: 230,
      // width: req.body.pixelSize,
      fit: sharp.fit.contain,
    })
    .jpeg({ quality: 90 })
    .toFile(`public/img/stock/${req.file.filename}`);

  next();
});

exports.createUpload = catchAsync(async (req, res, next) => {
  console.log('create upload', req.file, req.body.title);

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
