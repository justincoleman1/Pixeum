// Import multer library
const multer = require('multer');

// Configure multer to use in-memory storage for uploaded files
const multerStorage = multer.memoryStorage();

// Define a filter function to only allow certain file types
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true); // Images
  else if (file.mimetype.startsWith('application'))
    cb(null, true); // XML, zip, pdf
  else if (file.mimetype.startsWith('text')) cb(null, true); // Text
  else cb(new AppError('Not an image! Please upload an image.', 400), false);
};

// Export a configured multer object with the in-memory storage and file filter functions
exports.upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// The multerStorage variable sets the storage engine to memory storage which means that the file will be stored in memory as a Buffer object instead of being saved to disk. This is useful when you need to process the file before saving it, as is the case in this example.

// The multerFilter function defines a filter that only allows certain file types to be uploaded. If a file that does not match one of the specified file types is uploaded, an error message is returned.

// Finally, multer is called with the configured storage and file filter, and an object is returned that can be used as middleware to handle file uploads. This object is exported and can be used in other files to handle file uploads.

//Some extra syntax below ->>
//Upload a Single file
//upload.single('image') returns req.file

//Upload multiple files
//upload.array('image', 5) returns req.files

//Upload a mixture of arrays and single files
//upload.fields({name:'image',maxCount:1},{name:'image', maxCount:5})
