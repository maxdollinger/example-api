const Tour = require('../models/toursModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, res, next) => {
     req.query.limit = '5';
     req.query.sort = '-ratingsAverage,price';
     req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
     next();
};

exports.getAllTours = factory.getAll(Tour, {
     path: 'guides reviews'
});

exports.getOneTour = factory.getOne(Tour, {
     path: 'reviews guides',
     populate: {
          path: 'user',
          select: 'name'
     },
     select: '-role -__v'
});

exports.createTour = factory.createOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.deleteTourReviews = catchAsync(async (req, res, next) => {
     const deleted = await Review.deleteMany({
          tour: req.params.id
     });

     if (!deleted) {
          return next(new AppError(`Failed to delete reviews for tour: ${req.params.id}`, 500));
     }
})

exports.updateTour = factory.updateOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
     const stats = await Tour.aggregate([{
               $match: {
                    ratingsAverage: {
                         $gte: 4.5
                    }
               }
          },
          {
               $group: {
                    _id: '$difficulty',
                    numTours: {
                         $sum: 1
                    },
                    numRating: {
                         $sum: '$ratingsQuantity'
                    },
                    avgRating: {
                         $avg: '$ratingsAverage'
                    },
                    avgPrice: {
                         $avg: '$price'
                    },
                    minPrice: {
                         $min: '$price'
                    },
                    maxPrice: {
                         $max: '$price'
                    }
               }
          },
          {
               $set: {
                    avgRating: {
                         $round: ['$avgRating', 1]
                    },
                    avgPrice: {
                         $round: ['$avgPrice', 2]
                    }
               }
          },
          {
               $sort: {
                    avgRating: 1
               }
          }
     ]);

     res.status(201).json({
          status: 'success',
          data: {
               stats
          },
     });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

     const year = req.params.year;

     const plan = await Tour.aggregate([{
               $unwind: '$startDates'
          },
          {
               $match: {
                    startDates: {
                         $gte: new Date(`${year}-01-01`),
                         $lte: new Date(`${year}-12-31`)
                    }
               }
          },
          {
               $group: {

                    _id: {
                         $month: '$startDates'
                    },
                    numTours: {
                         $sum: 1
                    },
                    tours: {
                         $push: '$name'
                    }
               }
          },
          {
               $addFields: {
                    month: '$_id'
               }
          },
          {
               $project: {
                    _id: 0
               }
          },
          {
               $sort: {
                    month: 1
               }
          }
     ]);

     res.status(201).json({
          status: 'success',
          lengthOfObject: plan.length,
          data: {
               plan
          },
     });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
     const {
          distance,
          latlong,
          unit
     } = req.params;
     const [lat, long] = latlong.split(',');

     const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

     if (!lat || !long) {
          return next(new AppError(`Please provide Latitude and Longitude`, 400));
     }

     const tours = await Tour.find({
          startLocation: {
               $geoWithin: {
                    $centerSphere: [
                         [long, lat], radius
                    ]
               }
          }
     })

     res.status(200).json({
          satus: 'success',
          results: tours.length,
          data: {
               data: tours
          }
     });
});

exports.getDistances = catchAsync(async (req, res, next) => {
     const {
          latlong,
          unit
     } = req.params;
     const [lat, long] = latlong.split(',');

     if (!lat || !long) {
          return next(new AppError(`Please provide Latitude and Longitude`, 400));
     }

     const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

     const distances = await Tour.aggregate([{
               $geoNear: {
                    near: {
                         type: 'Point',
                         coordinates: [long * 1, lat * 1]
                    },
                    distanceField: 'distance',
                    distanceMultiplier: multiplier
               }
          },
          {
               $project: {
                    distance: 1,
                    name: 1,
                    distance: {
                         $round: ['$distance', 1]
                    }
               }
          }
     ]);

     res.status(200).json({
          satus: 'success',
          data: {
               data: distances
          }
     });
})