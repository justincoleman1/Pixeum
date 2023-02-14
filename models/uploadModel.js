const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); //Need for embedding but not referencing
// const validator = require('validator');
//types of uploads
// 'image',
// 'gif',
// 'video',
// 'short',
// 'pdf',
// 'audio',
// 'doc',
// 'txt',

const uploadSchema = new mongoose.Schema(
  {
    media: {
      type: String,
    },
    media_type: {
      type: String,
      required: [true, 'A upload must have a media_type'],
      enum: {
        values: ['image', 'application', 'text'],
        message: 'Media may only be of type image,application, or text',
      },
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A upload must have a user!'],
    },
    title: {
      type: String,
      required: [true, 'A upload must have a name'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    tags: [
      {
        type: String,
      },
    ],
    maturity: [
      {
        type: String,
        required: [true, 'An upload must have maturity marker.'],
        enum: {
          values: [
            'everyone',
            'moderate_nudity',
            'moderate_sexual_themes',
            'moderate_violence_and/or_gore',
            'moderate_strong_language',
            'moderate_ideologically_sensitive',
            'strict_nudity',
            'strict_sexual_themes',
            'strict_sexually_explicit_themes',
            'strict_violence_and/or_gore',
            'strict_strong_language',
            'strict_ideologically_sensitive',
          ],
          message: 'Maturity marker may only be of an allowed specified value.',
        },
      },
    ],
    access: {
      type: String,
      enum: {
        values: ['public', 'private', 'paying'],
      },
    },
    price: {
      type: Number,
      required: false,
      unique: false,
    },
    view_count: {
      type: Number,
      default: 1,
    },
    like_count: {
      type: Number,
      default: 1,
    },
    comments_count: {
      type: Number,
      default: 1,
    },
    sale_count: {
      type: Number,
      default: 0,
    },
    download_count: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          //this only works for current or created document and NOT UPDATE!
          return val <= this.price;
        },
        message: '({VALUE}) should be below the upload price',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//Only set index on highly queried attributes
uploadSchema.index({ view_count: -1 });
uploadSchema.index({ price: 1 });
uploadSchema.index({ slug: 1 });

//Virtual Populate
uploadSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'upload',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
uploadSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERIES MIDDLEWARE
uploadSchema.pre(/^find/, function (next) {
  this.find({ privateupload: { $ne: true } });
  this.start = Date.now();
  next();
});

uploadSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -email',
  });
  next();
});

//AGGREGATION MIDDLEWARE
// uploadSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   next();
// });

const upload = mongoose.model('upload', uploadSchema);

module.exports = upload;
