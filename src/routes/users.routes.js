const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users - List all users
router.get('/', usersController.getUsers);

// GET /api/users/:id - Get single user
router.get('/:id', usersController.getUserById);

// POST /api/users - Create new user
router.post('/', usersController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', usersController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', usersController.deleteUser);

module.exports = router;
