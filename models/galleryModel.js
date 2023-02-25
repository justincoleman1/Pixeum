const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  uploads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
    },
  ],
});

const Gallery = mongoose.model('Gallery', gallerySchema);
module.exports = Gallery;
