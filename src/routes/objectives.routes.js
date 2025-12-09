const express = require('express');
const router = express.Router();
const objectivesController = require('../controllers/objectives.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All objective routes require authentication
router.use(authMiddleware);

// GET /api/objectives - List all objectives
router.get('/', objectivesController.getObjectives);

// GET /api/objectives/:id - Get single objective
router.get('/:id', objectivesController.getObjectiveById);

// POST /api/objectives - Create new objective
router.post('/', objectivesController.createObjective);

// PUT /api/objectives/:id - Update objective
router.put('/:id', objectivesController.updateObjective);

// DELETE /api/objectives/:id - Delete objective
router.delete('/:id', objectivesController.deleteObjective);

module.exports = router;
