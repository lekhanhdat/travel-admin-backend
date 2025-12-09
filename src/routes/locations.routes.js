const express = require('express');
const router = express.Router();
const locationsController = require('../controllers/locations.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All location routes require authentication
router.use(authMiddleware);

// GET /api/locations - List all locations
router.get('/', locationsController.getLocations);

// GET /api/locations/types - Get unique location types for filter dropdown
router.get('/types', locationsController.getLocationTypes);

// GET /api/locations/:id - Get single location
router.get('/:id', locationsController.getLocationById);

// POST /api/locations - Create new location
router.post('/', locationsController.createLocation);

// PUT /api/locations/:id - Update location
router.put('/:id', locationsController.updateLocation);

// PATCH /api/locations/:id/marker - Toggle marker visibility
router.patch('/:id/marker', locationsController.toggleMarker);

// DELETE /api/locations/:id - Delete location
router.delete('/:id', locationsController.deleteLocation);

module.exports = router;
