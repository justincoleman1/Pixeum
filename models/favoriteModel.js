const mongoose = require('mongoose');
const Upload = require('./uploadModel');
const User = require('./userModel');

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

// Static method to update the favorite count of an upload
favoriteSchema.statics.updateFavoriteCount = async function (uploadId) {
  const favoriteCount = await this.countDocuments({ upload: uploadId });
  await Upload.findByIdAndUpdate(uploadId, {
    favorite_count: favoriteCount || 0,
  });
};

// Middleware function to update the favorite count when a favorite is created
favoriteSchema.post('save', async function () {
  console.log('Saving');
  await this.constructor.updateFavoriteCount(this.upload);
});

// Middleware function to update the favorite count when a favorite is deleted

favoriteSchema.pre('remove', { doc: true }, async function () {
  console.log('Deleting');
  await this.constructor.updateFavoriteCount(this);
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
