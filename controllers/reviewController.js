const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');


exports.setBodyData = (req, res, next) => {
     req.body.user = req.user._id;
     req.body.tour = req.body.tour || req.params.tourId;

     next();
};

exports.getReviews = factory.getAll(Review, {
     path: 'user tour',
     select: 'name'
});

exports.getOneReview = factory.getOne(Review, {
     path: 'user tour',
     select: 'name'
});

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);