const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gallerySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  is_favorite: {
    type: Boolean,
    default: false,
  },
  parent_gallery: {
    type: Schema.Types.ObjectId,
    ref: 'Gallery',
  },
  uploads: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Upload',
    },
  ],
});

module.exports = mongoose.model('Gallery', gallerySchema);

//Then, when you need to get the main child gallery for a user's encompassing favorites or user galleries, you can query for the gallery with isDefault set to true:
// const user = await User.findById(userId).populate('encompassingFavoritesGallery encompassingUserGallery');
// const allFavoritesGallery = user.encompassingFavoritesGallery.children.find(child => child.isDefault);
// const allUploadsGallery = user.encompassingUserGallery.children.find(child => child.isDefault);
