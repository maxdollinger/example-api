const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
     const doc = await Model.findByIdAndDelete(req.params.id);

     if (!doc) {
          return next(new AppError('No document found with that ID', 404));
     }

     res.status(204).json({
          status: 'success',
          data: null
     });

     next();
});

exports.updateOne = Model => catchAsync( async (req, res, next) => {

     const doc = await Model.findById(req.params.id);

     Object.keys(req.body).forEach( key => { 
          if(doc[key] !== undefined) doc[key] = req.body[key]
     });

     await doc.save({ validateModifiedOnly: true });

     if (!doc) {
          return next(new AppError('No tour found with that ID', 404));
     }

     res.status(201).json({
          status: 'success',
          data: {
               data: doc
          },
     });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
     const doc = await Model.create(req.body);

     res.status(201).json({
          status: 'success',
          data: {
               data: doc,
          },
     });

});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
     let query = Model.findById(req.params.id).lean();
     if(req.select) query = query.select(req.select);
     if(populateOptions) query = query.populate(populateOptions);

     const doc = await query;

     if (!doc) {
          return next(new AppError('No tour found with that ID', 404));
     }

     delete doc.__v;

     res.status(200).json({
          status: 'success',
          data: {
               data: doc
          },
     });
});

exports.getAll = (Model, populateOptions) => catchAsync(async (req, res, next) => {
     let filter = {};
     if(req.params.tourId) filter = {tour: req.params.tourId};
     let query = Model.find(filter).lean({virtuals: true});
     if(req.select) query = query.select(req.select);
     if(populateOptions) query = query.populate(populateOptions);

     const features = new APIFeatures(query, req.query)
          .filter()
          .sort()
          .limitFields()
          .paginate();

     const docs = await features.query;

     res.status(200).json({
          status: 'success',
          results: docs.length,
          data: {
               data: docs
          },
     });


});

