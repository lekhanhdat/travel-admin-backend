const express = require('express');
const router = express.Router();
const festivalsController = require('../controllers/festivals.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All festival routes require authentication
router.use(authMiddleware);

// GET /api/festivals - List all festivals
router.get('/', festivalsController.getFestivals);

// GET /api/festivals/types - Get unique festival types for filter dropdown
router.get('/types', festivalsController.getFestivalTypes);

// GET /api/festivals/:id - Get single festival
router.get('/:id', festivalsController.getFestivalById);

// POST /api/festivals - Create new festival
router.post('/', festivalsController.createFestival);

// PUT /api/festivals/:id - Update festival
router.put('/:id', festivalsController.updateFestival);

// DELETE /api/festivals/:id - Delete festival
router.delete('/:id', festivalsController.deleteFestival);

module.exports = router;
