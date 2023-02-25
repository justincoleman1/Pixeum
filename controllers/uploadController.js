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
const axios = require('axios');
const FormData = require('form-data');

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

exports.checkForNudity = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  console.log(req.body.maturity);
  console.log(req.body.maturity.length);
  console.log(req.body.maturity.includes('moderate'));
  console.log(req.body.maturity.includes('strict'));

  const imageBuffer = req.file.buffer;

  // Send the image buffer to the Sightengine API
  const formData = new FormData();
  formData.append('media', imageBuffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });
  formData.append('models', 'nudity-2.0');
  formData.append('api_user', '204557528');
  formData.append('api_secret', 'gsz7YJsFniemKtFx8KkL');

  axios({
    method: 'post',
    url: 'https://api.sightengine.com/1.0/check.json',
    data: formData,
    headers: formData.getHeaders(),
  })
    .then(function (response) {
      console.log('Sightengine API Response:', response.data);
      const nsfwScore = response.data.nudity.erotica;
      if (nsfwScore > 0.5) {
        try {
          if (!req.body.maturity) {
            // remove the empty string from the array and add 'moderate' in its place
            req.body.maturity = ['moderate'];
            req.body.maturity.push('nudity');
            req.body.maturity.push('sexual themes');
          } else {
            // check if 'nudity' is an array element within the maturity array, if it isn't, then add it
            if (!req.body.maturity.includes('nudity')) {
              req.body.maturity.push('nudity');
            }

            // check if 'sexual themes' is an array element within the maturity array, if it isn't, then add it
            if (!req.body.maturity.includes('sexual themes')) {
              req.body.maturity.push('sexual themes');
            }
          }
        } catch (error) {
          console.log('Error accessing maturity array:', error);
        }
      }
      next();
    })
    .catch(function (error) {
      console.log('Error:', error.message);
      return next();
    });
};

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

  const processImage = async (pathToFile) => {
    const rIB = await fs.promises.readFile(pathToFile);

    const metadata = await sharp(rIB).metadata();

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
      await processImage(`public/img/stock/${req.file.filename}`);
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  } else {
    await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toFile(`public/img/stock/${req.file.filename}`);
    try {
      await processImage(`public/img/stock/${req.file.filename}`);
    } catch (error) {
      return next(new AppError(error.message, 500));
    }
  }

  next();
});

exports.createUpload = catchAsync(async (req, res, next) => {
  console.log(req.body);
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
