const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user'],
  },
  type: {
    type: String,
    enum: ['like', 'reply', 'thread_reply', 'mention', 'subscription'],
    required: [true, 'Notification must have a type'],
  },
  fromUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must specify the user who triggered it'],
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    required: function () {
      return ['like', 'reply', 'thread_reply', 'mention'].includes(this.type);
    },
  },
  upload: {
    type: mongoose.Schema.ObjectId,
    ref: 'Upload',
    required: function () {
      return ['like', 'reply', 'thread_reply', 'mention'].includes(this.type);
    },
  },
  seen: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'username photo',
  })
    .populate({
      path: 'fromUser',
      select: 'username photo',
    })
    .populate({
      path: 'comment',
      select: 'elements upload',
    })
    .populate({
      path: 'upload',
      select: 'title slug user',
      populate: { path: 'user', select: 'username' },
    });
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
