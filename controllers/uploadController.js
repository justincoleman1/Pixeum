const fs = require('fs');
const sharp = require('sharp');
const { v5: uuidv5 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const slugify = require('slugify');
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
  console.log('Checking for nudity Middleware');
  if (!req.file) {
    // if there is no file, pass to the next middleware
    console.log('No file present...Skipping');
    return next();
  }

  if (
    req.body.maturity[0] === 'moderate' ||
    req.body.maturity[0] === 'strict'
  ) {
    // if there is no file, pass to the next middleware
    console.log('No check necessary...Skipping');
    return next();
  }

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
    const sexualDisplayScore = response.data.nudity.sexual_display;
    if (sexualDisplayScore > 0.5) {
      if (!req.body.maturity) {
        // If maturity is not set, add 'moderate' and 'nudity' to the maturity string
        req.body.maturity = 'strict,nudity';
      } else {
        // If maturity is already set, check if 'nudity' is included in the maturity string
        if (!req.body.maturity.includes('nudity')) {
          // If not, add 'nudity' to the maturity string
          req.body.maturity += ',nudity';
        }
        if (req.body.maturity.includes('moderate')) {
          req.body.maturity.replace('moderate', 'strict');
        }
      }
    }

    const sexualActivityScore = response.data.nudity.sexual_activity;
    if (sexualActivityScore > 0.5) {
      if (!req.body.maturity) {
        // If maturity is not set, add 'moderate' and 'nudity' to the maturity string
        req.body.maturity = 'strict,nudity';
      } else {
        // If maturity is already set, check if 'nudity' is included in the maturity string
        if (!req.body.maturity.includes('nudity')) {
          // If not, add 'nudity' to the maturity string
          req.body.maturity += ',nudity';
        }

        if (req.body.maturity.includes('moderate')) {
          req.body.maturity.replace('moderate', 'strict');
        }
      }
    }
  } catch (error) {
    // if there was an error with the request
    console.log('Error:', error.message);
  }
  console.log('Ending Nudity Check Middleware');
  next();
};

// Middleware to handle resizing the image and saving the original
exports.rawUploadedImage = catchAsync(async (req, res, next) => {
  console.log('Raw Upload Middleware');
  // If no file is present, skip this middleware and move on to the next one
  if (!req.file) {
    console.log('No file present...Skipping');
    return next();
  }

  // Generate a unique filename for the uploaded image
  // Generate a unique identifier using the current timestamp and namespace
  const timestamp = new Date().getTime();
  const uniqueFilename =
    uuidv5(`${process.env.NAME_SPACE}-${timestamp}`, process.env.NAME_SPACE) +
    '.jpeg';
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

  console.log('Ending Raw Upload Middleware');
  // Move on to the next middleware
  next();
});

// Middleware to resize uploaded images
exports.resizedUploadedImage = catchAsync(async (req, res, next) => {
  console.log('Resize Upload Middleware');
  if (!req.file) {
    console.log('No file present...Skipping');
    return next(); // If there is no uploaded file, move to next middleware
  }

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
  console.log('Ending Resize Upload Middleware');
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

// Middleware to resize uploaded images
exports.updateResizedUploadedImage = catchAsync(async (req, res, next) => {
  console.log('Update resized Upload Middleware');

  const slug = req.params.slug;

  // find the upload to be deleted
  const upload = await Upload.findOne({
    user: req.user._id,
    slug: slug,
  });

  if (
    !req.file &&
    (req.body.orginalWidthInt === upload.width ||
      parseInt(req.body.width) === upload.width)
  ) {
    console.log('No File Present...Skipping');
    return next(); // If there is no uploaded file, move to next middleware
  }

  const filePath = req.file
    ? `public/img/stock/${req.file.filename}`
    : `public/img/stock/${upload.media}`;

  const imageBuffer = req.file
    ? req.file.buffer
    : await fs.promises.readFile(`public/img/stock/raw-${upload.media}`); // Get the buffer of the uploaded file

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

  console.log(imageWidth);

  if (imageWidth !== null) {
    // If the image width is specified
    await sharp(imageBuffer) // Resize the image with sharp
      .resize({
        fit: sharp.fit.contain, // Set the fit method to contain
        width: imageWidth, // Set the width to resize
      })
      .jpeg({ quality: 90 }) // Convert the image to JPEG format with a quality of 90%
      .toFile(filePath); // Save the file to the server

    try {
      await processImage(filePath); // Process the image and set the metadata values
    } catch (error) {
      return next(new AppError(error.message, 500)); // If there is an error, send an error message
    }
  } else {
    await sharp(imageBuffer) // If the image width is not specified
      .jpeg({ quality: 90 }) // Convert the image to JPEG format with a quality of 90%
      .toFile(filePath); // Save the file to the server

    try {
      await processImage(filePath); // Process the image and set the metadata values
    } catch (error) {
      return next(new AppError(error.message, 500)); // If there is an error, send an error message
    }
  }
  console.log('End Resize Upload Middleware');
  next(); // Move to the next middleware
});

exports.updateMyUpload = catchAsync(async (req, res, next) => {
  console.log('In updateUpload middleware');
  console.log(req.body);

  // if (!req.body.length);
  //   return next(new AppError('No upload data provided', 400));

  const slug = req.params.slug;

  // find the upload to be deleted
  const upload = await Upload.findOne({
    user: req.user._id,
    slug: slug,
  });

  // check if the user is the owner of the upload
  if (!upload || upload.user.id !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this upload.', 403)
    );
  }

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
    filteredBody.format = req.body.format;
  }

  if (
    req.file ||
    req.body.orginalWidthInt !== upload.width ||
    parseInt(req.body.width) !== upload.width
  ) {
    filteredBody.size = formatBytes(req.body.size);
    filteredBody.width = req.body.width;
    filteredBody.height = req.body.height;
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

  if (filteredBody.title !== upload.title) {
    filteredBody.slug = slugify(
      filteredBody.title,

      { lower: true }
    );
  }
  // update upload object
  const updatedUpload = await Upload.findByIdAndUpdate(
    upload._id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  const areTagsEqual =
    filteredBody.tags.length === upload.tags.length &&
    filteredBody.tags.every((tag) => upload.tags.includes(tag));

  if (!areTagsEqual) {
    const newTags = filteredBody.tags.filter(
      (value) => !upload.tags.includes(value)
    );

    const oldTags = upload.tags.filter(
      (value) => !filteredBody.tags.includes(value)
    );

    const newMaturity = filteredBody.maturity.filter(
      (value) => !upload.maturity.includes(value)
    );

    const oldMaturity = upload.maturity.filter(
      (value) => !filteredBody.maturity.includes(value)
    );

    console.log(newTags, 'newTags');

    // For the values in filteredBody.tags that aren't in upload.tags
    if (newTags) {
      newTags.forEach(
        catchAsync(async function (tag) {
          if (newMaturity.length) {
            if (
              await Tag.exists({
                name: tag,
                maturity: newMaturity[0],
              })
            ) {
              await Tag.findOneAndUpdate(
                { name: tag, maturity: newMaturity[0] },
                { $inc: { count: 1 } }
              );
            } else {
              await Tag.create({
                name: tag,
                maturity: newMaturity[0],
              });
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
    console.log(oldTags, 'oldTags');

    if (oldTags.length) {
      for (const tag of oldTags) {
        let conditions = { name: tag };

        if (oldMaturity.length) {
          conditions.maturity = oldMaturity[0];
        }

        const tagObj = await Tag.findOne(conditions);
        console.log(tagObj, '-------------tagObj');

        if (tagObj) {
          if (tagObj.count === 1) {
            await Tag.findByIdAndDelete(tagObj._id);
          } else {
            await Tag.findByIdAndUpdate(tagObj._id, { $inc: { count: -1 } });
          }
        }
      }
    }
  }

  // return success status
  res.status(200).json({
    status: 'success',
    resSlug: updatedUpload.slug,
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
        numLikes: { $sum: '$favorite_count' },
        avgLikes: { $avg: '$favorite_count' },
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

// controllers/uploadController.js
exports.getUpload = catchAsync(async (req, res, next) => {
  const uploadsUser = await User.findOne({ username: req.params.username });
  if (!uploadsUser) {
    return res.status(404).json({
      status: 'fail',
      message: 'User does not exist',
    });
  }

  const upload = await Upload.findOne({
    user: uploadsUser._id,
    slug: req.params.slug,
  })
    .populate({
      path: 'user',
      select: 'username photo',
    })
    .populate({
      path: 'comments',
      match: { parentComment: null }, //Only top-level
      select:
        'elements user like_count dislike_count reply_count createdAt updatedAt parentComment isEdited deleted deletedAt',
      populate: [
        { path: 'user', select: 'username photo' },
        {
          path: 'comments', // Populate replies
          select:
            'elements user like_count dislike_count reply_count createdAt updatedAt parentComment isEdited deleted deletedAt',
          populate: [
            { path: 'user', select: 'username photo' },
            {
              path: 'comments',
              select:
                'elements user like_count dislike_count reply_count createdAt updatedAt parentComment isEdited deleted deletedAt',
              populate: [
                { path: 'user', select: 'username photo' },
                {
                  path: 'parentComment',
                  select:
                    'elements user like_count dislike_count reply_count createdAt updatedAt parentComment isEdited deleted deletedAt',
                  populate: { path: 'user', select: 'username photo' },
                },
              ],
            },
            {
              path: 'parentComment',
              select:
                'elements user like_count dislike_count reply_count createdAt updatedAt parentComment isEdited deleted deletedAt',
              populate: { path: 'user', select: 'username photo' },
            },
          ],
        },
      ],
    });

  if (!upload) {
    return res.status(404).json({
      status: 'fail',
      message: 'Upload does not exist',
    });
  }

  req.uploadsUser = uploadsUser;
  req.upload = upload;
  next();
});

// Handler to add or remove a reaction to an upload
exports.addReaction = catchAsync(async (req, res, next) => {
  const { username, slug } = req.params;
  const { reactionType } = req.body; // Expected: 'upvote', 'funny', 'love', 'surprised', 'angry', 'sad'
  const userId = req.user._id;

  console.log('Toggling reaction:', { username, slug, reactionType, userId });

  // Validate reaction type
  const validReactions = [
    'upvote',
    'funny',
    'love',
    'surprised',
    'angry',
    'sad',
  ];
  if (!validReactions.includes(reactionType)) {
    return next(new AppError('Invalid reaction type', 400));
  }

  // Find the upload by slug and verify the username matches
  const upload = await Upload.findOne({ slug }).populate('user');
  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }

  // Verify the username matches the upload's user
  if (upload.user.username !== username) {
    return next(new AppError('Upload not found for this user', 404));
  }

  // Check if the user has already reacted with this reaction type
  const reactionField = `reactions.${reactionType}`;
  console.log('Current reactions field:', upload.reactions);
  const hasReacted =
    upload.reactions &&
    upload.reactions[reactionType] &&
    upload.reactions[reactionType].includes(userId);

  const countField = `${reactionType}Count`;
  console.log(
    `Before update - ${countField}:`,
    upload[countField],
    'totalReactions:',
    upload.totalReactions
  );

  if (hasReacted) {
    // User has already reacted, so remove the reaction
    const updateResult = await Upload.updateOne(
      {
        _id: upload._id,
        [`${reactionField}`]: userId, // Ensure user has reacted
      },
      {
        $pull: { [reactionField]: userId }, // Remove user from the reaction array
        $inc: {
          [countField]: -1, // Decrement the reaction count
          totalReactions: -1, // Decrement the total reactions
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return next(new AppError('Reaction not found to remove', 400));
    }

    // Fetch the updated upload to get the new counts
    const updatedUpload = await Upload.findOne({ slug });
    console.log(
      `After remove - ${countField}:`,
      updatedUpload[countField],
      'totalReactions:',
      updatedUpload.totalReactions
    );

    res.status(200).json({
      status: 'success',
      action: 'removed',
      data: {
        [countField]: updatedUpload[countField],
        totalReactions: updatedUpload.totalReactions,
      },
    });
  } else {
    // User hasn't reacted, so add the reaction
    const updateResult = await Upload.updateOne(
      {
        _id: upload._id,
        [`${reactionField}`]: { $ne: userId }, // Ensure user hasn't already reacted
      },
      {
        $push: { [reactionField]: userId }, // Add user to the reaction array
        $inc: {
          [countField]: 1, // Increment the reaction count
          totalReactions: 1, // Increment the total reactions
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return next(
        new AppError(`You have already reacted with ${reactionType}`, 400)
      );
    }

    // Fetch the updated upload to get the new counts
    const updatedUpload = await Upload.findOne({ slug });
    console.log(
      `After add - ${countField}:`,
      updatedUpload[countField],
      'totalReactions:',
      updatedUpload.totalReactions
    );

    res.status(200).json({
      status: 'success',
      action: 'added',
      data: {
        [countField]: updatedUpload[countField],
        totalReactions: updatedUpload.totalReactions,
      },
    });
  }
});

// Handler to get the user's reaction state for an upload
exports.getUserReactionState = catchAsync(async (req, res, next) => {
  const { username, slug } = req.params;
  const userId = req.user._id;

  console.log('Fetching reaction state:', { username, slug, userId });

  // Find the upload by slug and verify the username matches
  const upload = await Upload.findOne({ slug }).populate('user');
  if (!upload) {
    return next(new AppError('Upload not found', 404));
  }

  // Verify the username matches the upload's user
  if (upload.user.username !== username) {
    return next(new AppError('Upload not found for this user', 404));
  }

  // Check which reaction types the user has reacted to
  const reactionState = {};
  const reactionTypes = [
    'upvote',
    'funny',
    'love',
    'surprised',
    'angry',
    'sad',
  ];
  let hasReacted = false;

  reactionTypes.forEach((type) => {
    const hasReactedToType =
      upload.reactions &&
      upload.reactions[type] &&
      upload.reactions[type].includes(userId);
    reactionState[type] = hasReactedToType;
    if (hasReactedToType) {
      hasReacted = true;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      hasReacted, // Boolean indicating if the user has reacted to any type
      reactionState, // Object indicating which types the user has reacted to
    },
  });
});

exports.getAllUploads = Handler.getAllDocs(Upload);
exports.updateUpload = Handler.updateDoc(Upload);
exports.deleteUpload = Handler.deleteDoc(Upload);
