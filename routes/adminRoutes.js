// routes/adminRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { mustBeAdminPage, mustBeAdmin } = require('../middlewares/authMiddleware');
const {
  renderAdminSelector,
  renderDashboard,
  renderUsers,
  renderTransactions,
  renderGames,
  renderSettings,
  getUserDetails,
  adjustUserBalance,
  updateTransactionStatus,
} = require('../controllers/adminController');


router.get('/sel-panel', mustBeAdminPage, renderAdminSelector);
router.get('/dashboard', mustBeAdminPage, renderDashboard);
router.get('/users', mustBeAdminPage, renderUsers);
router.get('/transactions', mustBeAdminPage, renderTransactions);
router.get('/games', mustBeAdminPage, renderGames);
router.get('/settings', mustBeAdminPage, renderSettings);


router.get('/api/user/:userId', mustBeAdmin, getUserDetails);
router.post('/api/user/:userId/balance', mustBeAdmin, adjustUserBalance);
router.post('/api/transaction/:transactionId/status', mustBeAdmin, updateTransactionStatus);

module.exports = router;
