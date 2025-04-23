const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/stock'); // Store all media in public/img/stock
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    // Use a prefix based on the request context (set in middleware)
    const prefix = req.uploadPrefix || 'upload'; // Default to 'upload' if not set
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // Images (including GIFs)
  } else {
    cb(new AppError('Only images and GIFs are allowed.', 400), false);
  }
};

// Create a reusable Multer instance
const multerUpload = multer({
  storage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware for upload media
exports.uploadMedia = (req, res, next) => {
  req.uploadPrefix = 'upload'; // Prefix for upload media
  multerUpload.single('media')(req, res, next);
};

// Middleware for comment media
exports.uploadCommentMedia = (req, res, next) => {
  req.uploadPrefix = 'comment'; // Prefix for comment media
  multerUpload.single('media')(req, res, next);
};
