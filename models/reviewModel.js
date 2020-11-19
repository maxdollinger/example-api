const mongoose = require('mongoose');
const Tour = require('./toursModel');

const reviewSchema = new mongoose.Schema({
     user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: true
     },
     tour: {
          type: mongoose.Schema.ObjectId,
          ref: 'Tour',
          required: true
     },
     createdAt: {
          type: Date,
          default: Date.now(),
     },
     rating: {
          type: Number,
          min: 1,
          max: 5,
          default: 4.5
     },
     text: String,

}, {
     toJSON: {
          virtuals: true
     },
     toObject: {
          virtuals: true
     }
});

reviewSchema.statics.setTourRatingAvg = async function (tourId) {
     const stats = await this.aggregate([{
               $match: {
                    tour: tourId
               }
          },
          {
               $group: {
                    _id: '$tour',
                    nRating: {
                         $sum: 1
                    },
                    avgRating: {
                         $avg: '$rating'
                    },
               }
          }
     ]);

     let data;

     if (stats.length > 0) {
          data = {
               ratingsQuantity: stats[0].nRating,
               ratingsAverage: stats[0].avgRating
          };

     } else {
          data = {
               ratingsQuantity: 0,
               ratingsAverage: 4.5
          };
     }

     await Tour.findByIdAndUpdate(tourId, data);
};

reviewSchema.index({
     tour: 1,
     user: 1
}, {
     unique: true
});

reviewSchema.pre('save', function (next) {
     if (this.isModified) {
          this.createdAt = Date.now();
          delete this.user;
          delete this.tour;
          delete this._id;
     }

     next();
});

reviewSchema.post('save', function () {
     this.constructor.setTourRatingAvg(this.tour);
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
     this.r = await this.findOne();
     next();
})

reviewSchema.post(/^findOneAnd/, async function () {
     this.r.constructor.setTourRatingAvg(this.r.tour);
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;