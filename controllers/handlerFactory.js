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
