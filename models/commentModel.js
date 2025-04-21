// models/commentModel.js
const mongoose = require('mongoose');
const Upload = require('./uploadModel');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minlength: 1,
      maxlength: 255,
      required: [true, 'Comment cannot be empty!'],
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
commentSchema.index({ parentComment: 1 });

commentSchema.pre(/^find/, function (next) {
  this.sort({ createdAt: -1 });
  this.populate({
    path: 'user',
    select: 'username photo',
  });
  next();
});

commentSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

commentSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'parentComment',
  localField: '_id',
});

// Increment comment_count for top-level comments, reply_count for replies
commentSchema.post('save', async function (doc, next) {
  try {
    if (!doc.parentComment) {
      await Upload.findByIdAndUpdate(doc.upload, {
        $inc: { comment_count: 1 },
      });
    } else {
      await this.model('Comment').findByIdAndUpdate(doc.parentComment, {
        $inc: { reply_count: 1 },
      });
    }
    next();
  } catch (err) {
    console.error('Error updating counts:', err);
    next(err);
  }
});

// Decrement comment_count or reply_count on deletion
commentSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      if (!this.parentComment) {
        await Upload.findByIdAndUpdate(this.upload, {
          $inc: { comment_count: -1 },
        });
      } else {
        await this.model('Comment').findByIdAndUpdate(this.parentComment, {
          $inc: { reply_count: -1 },
        });
      }
      // Delete replies to this comment
      await this.model('Comment').deleteMany({ parentComment: this._id });
      next();
    } catch (err) {
      console.error('Error updating counts:', err);
      next(err);
    }
  }
);

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
