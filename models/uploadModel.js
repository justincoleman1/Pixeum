const mongoose = require('mongoose');
const slugify = require('slugify');
const { makeid } = require('../utils/makeId');
// const validator = require('validator');

const uploadSchema = new mongoose.Schema(
  {
    media: {
      type: String,
    },
    mimetype: {
      type: String,
      enum: {
        values: ['image', 'application', 'text'],
        message: 'Media may only be of type image, application, or text',
      },
    },
    width: Number,
    height: Number,
    format: String,
    size: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A upload must have a user!'],
    },
    title: {
      type: String,
      required: [true, 'A upload must have a title'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    tags: [
      {
        type: String,
      },
    ],
    maturity: {
      type: [String],
      enum: [
        '',
        'moderate',
        'strict',
        'nudity',
        'sexual themes',
        'violence and/or gore',
        'strong language',
        'ideologically sensitive',
      ],
    },
    upvoteCount: {
      type: Number,
      default: 0,
    },
    funnyCount: {
      type: Number,
      default: 0,
    },
    loveCount: {
      type: Number,
      default: 0,
    },
    surprisedCount: {
      type: Number,
      default: 0,
    },
    angryCount: {
      type: Number,
      default: 0,
    },
    sadCount: {
      type: Number,
      default: 0,
    },
    totalReactions: {
      type: Number,
      default: 0,
    },
    reactions: {
      upvote: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // Authenticated users
        guests: [{ type: String }], // Unauthenticated users (session IDs)
      },
      funny: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        guests: [{ type: String }],
      },
      love: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        guests: [{ type: String }],
      },
      surprised: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        guests: [{ type: String }],
      },
      angry: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        guests: [{ type: String }],
      },
      sad: {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        guests: [{ type: String }],
      },
    },
    // slug: String,
    access: {
      type: String,
      enum: {
        values: ['public', 'private', 'paying'],
      },
    },
    price: {
      type: Number,
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },
    favorite_count: {
      type: Number,
      default: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
    },
    sale_count: {
      type: Number,
      default: 0,
    },
    download_count: {
      type: Number,
      default: 0,
    },
    discount: {
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
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

uploadSchema.set('timestamps', true);
//Only set index on highly queried attributes
// uploadSchema.index({ view_count: -1 });
// uploadSchema.index({ price: 1 });
// uploadSchema.index({ slug: 1 });

uploadSchema.pre(/^find/, function (next) {
  this.sort({ createdAt: -1 });
  this.populate({
    path: 'user',
    select: 'username photo',
  });

  next();
});

//Virtual Populate
uploadSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'upload',
  localField: '_id',
});
uploadSchema.virtual('users', {
  ref: 'User',
  foreignField: 'upload',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
uploadSchema.pre('save', function (next) {
  this.slug = slugify(this.title, {
    lower: true,
  });
  next();
});

//QUERIES MIDDLEWARE
// uploadSchema.pre(/^find/, function (next) {
//   this.find({ private: { $ne: true } });
//   this.start = Date.now();
//   next();
// });

// uploadSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'guides',
//     select: '-__v -passwordChangedAt -email',
//   });
//   next();
// });

//AGGREGATION MIDDLEWARE
// uploadSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   next();
// });

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload;
