const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

//Checks
const checkIfDocExist = (doc) => async (next) => {
  if (!doc) return next(new AppError(`No ${doc} found!`, 404));
};

//BASIC DATABASE FUNCTIONS
exports.createDoc = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    checkIfDocExist(newDoc);

    res.status(201).json({
      status: 'success',
      data: {
        newDoc,
      },
    });
  });

exports.getDoc = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    checkIfDocExist(doc);

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAllDocs = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.uploadId) filter = { upload: req.params.uploadId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  });

exports.updateDoc = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    checkIfDocExist(doc);

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteDoc = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    checkIfDocExist(doc);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// This code exports a set of database functions that perform CRUD operations on documents of a given Model (a Mongoose schema). The functions include createDoc, getDoc, getAllDocs, updateDoc, and deleteDoc. The functions take in the Model as an argument, and return middleware functions that can be used with an HTTP route.

// The code also includes a function called checkIfDocExist, which is used to verify that a document exists before performing a certain operation on it. This function is used in the getDoc, updateDoc, and deleteDoc functions.

// The createDoc function creates a new document of the given Model, and returns the created document in the response.

// The getDoc function gets a single document by its ID, and returns the document in the response. If a popOptions argument is provided, the function will populate the specified fields of the document.

// The getAllDocs function gets all documents of the given Model that match a certain filter (if specified in the URL query params), and returns an array of documents in the response. The response also includes the number of documents returned.

// The updateDoc function updates a document by its ID, and returns the updated document in the response.

// The deleteDoc function deletes a document by its ID, and returns a success status in the response.

// All of these functions use the catchAsync middleware to handle any errors that might occur during the database operation. The AppError and APIFeatures modules are also imported for use in these functions.
