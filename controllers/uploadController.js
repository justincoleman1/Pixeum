const fs = require('fs');
const sharp = require('sharp');
const { v5: uuidv5 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const Handler = require('./handlerFactory');
const Upload = require('../models/uploadModel');
const Tag = require('../models/tagModel');
const User = require('../models/userModel');
const { upload } = require('./multerController');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { formatBytes } = require('../utils/formatBytes');

// Middleware to set the user ID for a new upload
exports.setUploadUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

// Utility function to filter an object for certain properties
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware to handle the file upload itself
exports.uploadMain = upload.single('media');

// Middleware to check for nudity using the Sightengine API
exports.checkForNudity = async (req, res, next) => {
  if (!req.file) {
    // if there is no file, pass to the next middleware
    return next();
  }

  if (!req.body.maturity.includes('nudity')) {
    const imageBuffer = req.file.buffer;

    // Create FormData to send the image buffer to the Sightengine API
    const formData = new FormData();
    formData.append('media', imageBuffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('models', 'nudity-2.0');
    formData.append('api_user', '204557528');
    formData.append('api_secret', 'gsz7YJsFniemKtFx8KkL');

    try {
      // Send a post request to the Sightengine API with the FormData and wait for the response
      const response = await axios({
        method: 'post',
        url: 'https://api.sightengine.com/1.0/check.json',
        data: formData,
        headers: formData.getHeaders(),
      });

      // if request was successful
      console.log('Sightengine API Response:', response.data);

      // Check if the nudity score is greater than 0.5
      const nsfwScore = response.data.nudity.erotica;
      if (nsfwScore > 0.5) {
        if (!req.body.maturity) {
          // If maturity is not set, add 'moderate' and 'nudity' to the maturity string
          req.body.maturity = 'moderate,nudity';
        } else {
          // If maturity is already set, check if 'nudity' is included in the maturity string
          if (!req.body.maturity.includes('nudity')) {
            // If not, add 'nudity' to the maturity string
            req.body.maturity += ',nudity';
          }
        }
      }
    } catch (error) {
      // if there was an error with the request
      console.log('Error:', error.message);
    }
  }

  next();
};

// Middleware to handle resizing the image and saving the original
exports.rawUploadedImage = catchAsync(async (req, res, next) => {
  // If no file is present, skip this middleware and move on to the next one
  if (!req.file) return next();

  // Generate a unique filename for the uploaded image
  // Generate a unique identifier using the current timestamp and namespace
  const timestamp = new Date().getTime();
  const uniqueFilename =
    uuidv5(`${process.env.NAME_SPACE}-${timestamp}`, process.env.NAME_SPACE) +
    '.jpeg';
  // const uniqueFilename = ${makeid(5)}` + `-${req.user._id}-${Date.now()}.jpeg`;
  req.body.filename = uniqueFilename;
  req.file.filename = req.body.filename;

  // Extract the raw pixel data and image info using Sharp
  const { data, info } = await sharp(req.file.buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert the raw pixel data to a Uint8ClampedArray and retrieve the width, height, and channels from the image info
  const pixelArray = new Uint8ClampedArray(data.buffer);
  const { width, height, channels } = info;

  // Write the raw image file to disk using Sharp
  await sharp(pixelArray, { raw: { width, height, channels } }).toFile(
    `public/img/stock/raw-${req.file.filename}`
  );

  // Move on to the next middleware
  next();
});

// Middleware to resize uploaded images
exports.resizedUploadedImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); // If there is no uploaded file, move to next middleware

  req.file.filename = req.body.filename; // Set filename from request body

  const imageBuffer = req.file.buffer; // Get the buffer of the uploaded file

  const imageWidth =
    req.body.width !== 'original' ? parseInt(req.body.width) : null; // Get the width of the image to resize

  const processImage = async (pathToFile) => {
    // Function to process the image file
    const rIB = await fs.promises.readFile(pathToFile); // Read the image buffer

    const metadata = await sharp(rIB).metadata(); // Get the image metadata

    req.body.size = metadata.size; // Set the file size from metadata
    req.body.width = metadata.width; // Set the file width from metadata
    req.body.height = metadata.height; // Set the file height from metadata
    req.body.format = metadata.format; // Set the file format from metadata
  };

  if (imageWidth !== null) {
    // If the image width is specified
    await sharp(imageBuffer) // Resize the image with sharp
      .resize({
        fit: sharp.fit.contain, // Set the fit method to contain
        width: imageWidth, // Set the width to resize
      })
      .jpeg({ quality: 90 }) // Convert the image to JPEG format with a quality of 90%
      .toFile(`public/img/stock/${req.file.filename}`); // Save the file to the server

    try {
      await processImage(`public/img/stock/${req.file.filename}`); // Process the image and set the metadata values
    } catch (error) {
      return next(new AppError(error.message, 500)); // If there is an error, send an error message
    }
  } else {
    await sharp(imageBuffer) // If the image width is not specified
      .jpeg({ quality: 90 }) // Convert the image to JPEG format with a quality of 90%
      .toFile(`public/img/stock/${req.file.filename}`); // Save the file to the server

    try {
      await processImage(`public/img/stock/${req.file.filename}`); // Process the image and set the metadata values
    } catch (error) {
      return next(new AppError(error.message, 500)); // If there is an error, send an error message
    }
  }

  next(); // Move to the next middleware
});

// create new upload object with filteredBody and upload data from multer middleware
exports.createUpload = catchAsync(async (req, res, next) => {
  // filter object to only include certain fields
  const filteredBody = filterObj(
    req.body,
    'title',
    'description',
    'tags',
    'maturity'
  );

  // if file is included in request, add media data to filteredBody
  if (req.file) {
    filteredBody.media = req.file.filename;
    filteredBody.mimetype = req.file.mimetype.split('/')[0];
    filteredBody.size = formatBytes(req.body.size);
    filteredBody.width = req.body.width;
    filteredBody.height = req.body.height;
    filteredBody.format = req.body.format;
  }
  // add user id to filteredBody
  filteredBody.user = req.user._id;

  // Split tags and maturity by comma and create arrays
  const tagArray = filteredBody.tags ? filteredBody.tags.split(',') : [];
  const maturityArray = filteredBody.maturity
    ? filteredBody.maturity.split(',')
    : [];

  // Trim whitespace from tag and maturity values
  const trimmedTagArray = tagArray.map((tag) => tag.trim());
  const trimmedMaturityArray = maturityArray.map((maturity) => maturity.trim());

  // Add tag and maturity arrays to filteredBody
  filteredBody.tags = trimmedTagArray;
  filteredBody.maturity = trimmedMaturityArray;

  // create new upload object
  const newUpload = await Upload.create(filteredBody);

  // add tag count to existing tags or create new tags
  if (filteredBody.tags) {
    filteredBody.tags.forEach(
      catchAsync(async function (tag) {
        if (filteredBody.maturity.length) {
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
            // create new tag if it doesn't exist
            await Tag.create({ name: tag });
          }
        }
      })
    );
  }

  const user = await User.findOne({ _id: req.user.id }).select('username');
  const username = user.username;

  // return success status
  res.status(200).json({
    status: 'success',
    username: username,
    slug: newUpload.slug,
  });
});

exports.deleteMyUpload = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;

  // find the upload to be deleted
  const upload = await Upload.findOne({
    user: req.user._id,
    slug: slug,
  });

  // check if the user is the owner of the upload
  if (!upload || upload.user.id !== req.user.id) {
    return next(
      new AppError('You are not authorized to delete this upload.', 403)
    );
  }

  // delete the upload from the Upload model
  await Upload.findByIdAndDelete(upload._id);

  // delete the tags from the Tag model
  if (upload.tags.length) {
    for (const tag of upload.tags) {
      let conditions = { name: tag };
      if (upload.maturity.length) {
        conditions.maturity = upload.maturity[0];
      } else {
        conditions.maturity = { $exists: false };
      }
      const tagObj = await Tag.findOne(conditions);
      if (tagObj) {
        if (tagObj.count === 1) {
          await Tag.findByIdAndDelete(tagObj._id);
        } else {
          await Tag.findByIdAndUpdate(tagObj._id, { $inc: { count: -1 } });
        }
      }
    }
  }
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

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

exports.getAllUploads = Handler.getAllDocs(Upload);
exports.getUpload = Handler.getDoc(Upload, { path: 'comments' });
exports.updateUpload = Handler.updateDoc(Upload);
exports.deleteUpload = Handler.deleteDoc(Upload);
