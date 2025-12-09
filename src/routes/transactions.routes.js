const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All transaction routes require authentication
router.use(authMiddleware);

// GET /api/transactions - List all transactions (read-only)
router.get('/', transactionsController.getTransactions);

// GET /api/transactions/stats - Get transaction/points statistics
router.get('/stats', transactionsController.getTransactionStats);

module.exports = router;
