const express = require('express');
const router = express.Router();
const locationsController = require('../controllers/locations.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All location routes require authentication
router.use(authMiddleware);

// GET /api/locations - List all locations with pagination
router.get('/', locationsController.getLocations);

// GET /api/locations/:id - Get single location
router.get('/:id', locationsController.getLocationById);

// POST /api/locations - Create new location
router.post('/', locationsController.createLocation);

// PUT /api/locations/:id - Update location
router.put('/:id', locationsController.updateLocation);

// DELETE /api/locations/:id - Delete location
router.delete('/:id', locationsController.deleteLocation);

// PATCH /api/locations/:id/marker - Toggle marker visibility
router.patch('/:id/marker', locationsController.toggleMarker);

module.exports = router;
