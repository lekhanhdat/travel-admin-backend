const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/stats - Get all statistics
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/charts - Get chart data
router.get('/charts', dashboardController.getCharts);

module.exports = router;
