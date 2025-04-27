const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// Configure disk storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/stock');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = req.uploadPrefix || 'upload';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images and GIFs are allowed.', 400), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

exports.uploadMedia = (req, res, next) => {
  req.uploadPrefix = 'upload';
  multerUpload.single('media')(req, res, next);
};

exports.uploadCommentMedia = (req, res, next) => {
  req.uploadPrefix = 'comment';
  multerUpload.any()(req, res, next); // Use .any() to accept dynamic field names
};
