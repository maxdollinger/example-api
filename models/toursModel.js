const mongoose = require('mongoose');
const slugify = require('slugify');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field: "name" is required'],
    unique: [true, 'Field: "name" must be unique'],
    maxlength: [50, 'Field: "name" is to long. Only 50 characters.'],
    trim: true,
    validate: {
      validator: function (val) {
        if (val.replace(/\w|\s/g, '')) {
          return false;
        } else {
          return true
        }
      },
      message: 'Field: "name" can only contain letters and numbers'
    }
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'Field: "duration" is required']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Field: "maxGroupSize" is required']
  },
  difficulty: {
    type: String,
    required: [true, 'Field: "difficulty" is required'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Field: "difficulty" only valid options: "easy | medium | difficult"'
    }
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Field: "ratinsAverage" must be between 1 and 5'],
    max: [5, 'Field: "ratinsAverage" must be between 1 and 5'],
    set: val => Math.round(val * 10) / 10
  },
  price: {
    type: Number,
    required: [true, 'Field: "price" is required']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        return val < this.price
      },
      message: 'Field: "priceDiscount" must be less the the price. current value: {VALUE}'
    }
  },
  summary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Field: "description" is required']
  },
  imageCover: {
    type: String,
    required: [true, 'Field: "imageCover" is required']
  },
  images: [String],
  createAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [{
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number

  }],
  guides: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  secretTour: {
    type: Boolean,
    default: false,
    select: false
  }
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

tourSchema.index({
  price: 1,
  ratingsAverage: -1
});
tourSchema.index({
  slug: 1
});
tourSchema.index({
  startLocation: '2dsphere'
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//Document Middleware(Hooks)
tourSchema.pre('save', function (next) {
  this.name = this.name.replace(/\s\s+/g, ' ');
  this.slug = slugify(this.name, {
    lower: true
  });

  next();
});

//Query Middlewar(Hooks)
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  next();
});

//Aggregation Middleware(Hooks)
tourSchema.pre('aggregate', function (next) {
  
  if (Object.keys(this.pipeline()[0]).includes('$geoNear')) {
    this.pipeline().splice(1, 0, {
      $match: {
        secretTour: {
          $ne: true
        }
      }
    })
  } else {
    this.pipeline().unshift({
      $match: {
        secretTour: {
          $ne: true
        }
      }
    });
  }

  next();
});

tourSchema.plugin(mongooseLeanVirtuals);

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;