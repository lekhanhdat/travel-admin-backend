const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const locationsRoutes = require('./locations.routes');
const festivalsRoutes = require('./festivals.routes');
const reviewsRoutes = require('./reviews.routes');
const usersRoutes = require('./users.routes');
const objectsRoutes = require('./objects.routes');
const objectivesRoutes = require('./objectives.routes');
const transactionsRoutes = require('./transactions.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/locations', locationsRoutes);
router.use('/festivals', festivalsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/users', usersRoutes);
router.use('/objects', objectsRoutes);
router.use('/objectives', objectivesRoutes);
router.use('/transactions', transactionsRoutes);

module.exports = router;
