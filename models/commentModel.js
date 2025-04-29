const mongoose = require('mongoose');
const Upload = require('./uploadModel');

const commentSchema = new mongoose.Schema(
  {
    elements: [
      // Array to store ordered elements (text and media)
      {
        type: {
          type: String,
          enum: ['text', 'image', 'gif'],
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
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
    likedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    dislikedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
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
    isEdited: {
      type: Boolean,
      default: false,
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

commentSchema.pre('save', async function (next) {
  if (!this.user) {
    return next(new Error('Comment must have a user'));
  }
  const user = await mongoose.model('User').findById(this.user);
  if (!user) {
    return next(new Error('Invalid user reference'));
  }
  if (!this.isNew && this.isModified('elements')) {
    this.isEdited = true;
  }
  next();
});

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
    await Upload.findByIdAndUpdate(doc.upload, {
      $inc: { comment_count: 1 },
    });
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

commentSchema.methods.softDelete = async function () {
  await this.model('Comment').updateOne(
    { _id: this._id },
    {
      $set: {
        deleted: true,
        deletedAt: new Date(),
        elements: [{ type: 'text', value: '[deleted]' }],
      },
    }
  );
  return { status: 'soft-deleted' };
};

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
      const ageInMs = Date.now() - this.createdAt.getTime();
      const softDeleteThreshold = 24 * 60 * 60 * 1000;

      if (ageInMs >= softDeleteThreshold) {
        throw new Error('Soft deletion required');
      }

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
      const upload = await Upload.findById(this.upload);
      const currentCount = upload ? upload.comment_count || 0 : 0;
      const newCount = Math.max(currentCount - totalCommentsToDecrement, 0);
      await Upload.findByIdAndUpdate(
        this.upload,
        {
          $set: { comment_count: newCount },
        },
        { strict: false }
      );
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
      await this.model('Comment').deleteMany({ parentComment: this._id });
      next();
    } catch (err) {
      if (err.message === 'Soft deletion required') {
        next();
      } else {
        console.error('Error updating counts on delete:', err);
        next(err);
      }
    }
  }
);

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
