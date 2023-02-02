const multer = require('multer');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not a image! Please upload an image.', 400), false);
};

exports.upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//Upload a Single file
//upload.single('image') returns req.file

//Upload multiple files
//upload.array('image', 5) returns req.files

//Upload a mixture of arrays and single files
//upload.fields({name:'image',maxCount:1},{name:'image', maxCount:5})
