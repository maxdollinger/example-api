const express = require('express');
const auth = require('../controllers/authController');
const reviews = require('../controllers/reviewController');

const router = express.Router({mergeParams: true});

router.use(auth.protectRoute);

router
     .route('/')
     .get(reviews.getReviews)
     .post(
          auth.restrictTo('user', 'admin'),
          reviews.setBodyData,
          reviews.createReview);
router
     .route('/:id')
     .get(reviews.getOneReview)
     .delete(
          auth.restrictTo('user', 'admin'),
          reviews.deleteReview)
     .patch(
          auth.restrictTo('user', 'admin'),
          reviews.updateReview);

module.exports = router;