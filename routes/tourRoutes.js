const express = require('express');
const tour = require('../controllers/toursController.js');
const auth = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews/', reviewRouter);

router
  .route('/')
  .get(tour.getAllTours)
  .post(
    auth.protectRoute,
    auth.restrictTo('admin', 'lead-guid'),
    tour.createTour);
router
  .route('/tours-stats')
  .get(
    tour.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    auth.protectRoute,
    auth.restrictTo('admin', 'lead-guid', 'guid'),
    tour.getMonthlyPlan);
router
  .route('/tours-within/:distance/center/:latlong/unit/:unit')
  .get(tour.getToursWithin);
router
  .route('/distances/:latlong/unit/:unit')
  .get(tour.getDistances);
router
  .route('/top-5-cheap')
  .get(
    tour.aliasTopTours,
    tour.getAllTours);
router
  .route('/:id')
  .get(tour.getOneTour)
  .patch(
    auth.protectRoute,
    auth.restrictTo('admin', 'lead-guid'),
    tour.updateTour)
  .delete(
    auth.protectRoute,
    auth.restrictTo('admin', 'lead-guid'),
    tour.deleteTour,
    tour.deleteTourReviews);

module.exports = router;