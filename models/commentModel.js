const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minlength: 1,
      maxlength: 255,
      require: [true, 'Comment can not be empty!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A comment must have a user!'],
    },
    upload: {
      type: mongoose.Schema.ObjectId,
      ref: 'Upload',
      required: [true, 'A comment must have an upload!'],
    },
    parentComment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment',
      default: null,
    },
    like_count: {
      type: Number,
      default: 0,
    },
    dislike_count: {
      type: Number,
      default: 0,
    },
    reply_count: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.set('timestamps', true);

commentSchema.index({ upload: 1, user: 1 });

commentSchema.pre(/^find/, function (next) {
  this.sort({ createdAt: -1 });

  this.populate({
    path: 'user',
    select: 'username photo',
  });

  next();
});
//get access to the current comment document
commentSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

commentSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'parentComment',
  localField: '_id',
});

// commentSchema.post(/^findOneAnd/, async function () {
//   await this.findOne(); does not work here, query is already executed
// });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
