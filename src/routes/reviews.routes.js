const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All review routes require authentication
router.use(authMiddleware);

// GET /api/reviews - List all reviews
router.get('/', reviewsController.getReviews);

// GET /api/reviews/stats - Get review statistics
router.get('/stats', reviewsController.getReviewStats);

// GET /api/reviews/locations - Get location names for filter dropdown
router.get('/locations', reviewsController.getLocationNames);

// GET /api/reviews/festivals - Get festival names for filter dropdown
router.get('/festivals', reviewsController.getFestivalNames);

// DELETE /api/reviews/:source/:sourceId/:reviewIndex - Delete a specific review
router.delete('/:source/:sourceId/:reviewIndex', reviewsController.deleteReview);

module.exports = router;
