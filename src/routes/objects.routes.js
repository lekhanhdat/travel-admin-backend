const express = require('express');
const router = express.Router();
const objectsController = require('../controllers/objects.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All object routes require authentication
router.use(authMiddleware);

// GET /api/objects - List all objects
router.get('/', objectsController.getObjects);

// GET /api/objects/:id - Get single object
router.get('/:id', objectsController.getObjectById);

// POST /api/objects - Create new object
router.post('/', objectsController.createObject);

// PUT /api/objects/:id - Update object
router.put('/:id', objectsController.updateObject);

// DELETE /api/objects/:id - Delete object
router.delete('/:id', objectsController.deleteObject);

module.exports = router;
