const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A favorite must belong to a user!'],
    },
    upload: {
      type: mongoose.Schema.ObjectId,
      ref: 'Upload',
      required: [true, 'A favorite must belong to an upload!'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// We use a static method to calculate and update the like count
// of the referenced upload when a favorite is created or deleted.
// We pass the user ID and upload ID as arguments to the method.
favoriteSchema.statics.updateLikeCount = async function (userId, uploadId) {
  // We use the `aggregate` method of the model to calculate the
  // sum of all likes for the given upload ID.
  const stats = await this.aggregate([
    {
      $match: { upload: uploadId },
    },
    {
      $group: {
        _id: '$upload',
        nLikes: { $sum: 1 },
      },
    },
  ]);

  // If there are any likes for the given upload, we update the
  // `like_count` property of the upload with the sum of all likes.
  if (stats.length > 0) {
    await mongoose.model('Upload').findByIdAndUpdate(uploadId, {
      like_count: stats[0].nLikes,
    });
  } else {
    // If there are no likes for the given upload, we set the
    // `like_count` property of the upload to 0.
    await mongoose.model('Upload').findByIdAndUpdate(uploadId, {
      like_count: 0,
    });
  }

  // We return the updated like count.
  const upload = await mongoose.model('Upload').findById(uploadId);
  return upload.like_count;
};

// We use a middleware to update the like count of the referenced
// upload when a favorite is created or deleted.
favoriteSchema.post('save', async function () {
  await this.constructor.updateLikeCount(this.user, this.upload);
});

favoriteSchema.pre('remove', async function () {
  await this.constructor.updateLikeCount(this.user, this.upload);
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
