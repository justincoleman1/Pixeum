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
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
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
  this.sort({ createdAt: 1 });
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
    console.log(
      'Saving comment:',
      doc._id,
      'Parent:',
      doc.parentComment,
      'Upload:',
      doc.upload
    );
    // Increment comment_count on the Upload for every comment
    await Upload.findByIdAndUpdate(doc.upload, {
      $inc: { comment_count: 1 },
    });
    // If it's a reply, increment reply_count on the parent comment
    if (doc.parentComment) {
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

commentSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      console.log(
        'Deleting comment:',
        this._id,
        'Parent:',
        this.parentComment,
        'Upload:',
        this.upload
      );
      // Calculate total comments to decrement (this comment + all nested replies)
      let totalCommentsToDecrement = 1;
      const replies = await this.model('Comment').find({
        parentComment: this._id,
      });
      const stack = [...replies];
      while (stack.length > 0) {
        const reply = stack.pop();
        totalCommentsToDecrement += 1;
        const nestedReplies = await this.model('Comment').find({
          parentComment: reply._id,
        });
        stack.push(...nestedReplies);
      }
      // Fetch the current comment_count and calculate the new value
      const upload = await Upload.findById(this.upload);
      const currentCount = upload ? upload.comment_count || 0 : 0;
      const newCount = Math.max(currentCount - totalCommentsToDecrement, 0);
      // Update comment_count on the Upload
      await Upload.findByIdAndUpdate(
        this.upload,
        {
          $set: { comment_count: newCount },
        },
        { strict: false }
      );
      // If it's a reply, decrement reply_count on the parent comment
      if (this.parentComment) {
        const parentComment = await this.model('Comment').findById(
          this.parentComment
        );
        const currentReplyCount = parentComment
          ? parentComment.reply_count || 0
          : 0;
        const newReplyCount = Math.max(currentReplyCount - 1, 0);
        await this.model('Comment').findByIdAndUpdate(
          this.parentComment,
          {
            $set: { reply_count: newReplyCount },
          },
          { strict: false }
        );
      }
      // Delete all replies to this comment
      await this.model('Comment').deleteMany({ parentComment: this._id });
      next();
    } catch (err) {
      console.error('Error updating counts on delete:', err);
      next(err);
    }
  }
);
const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
