// src/routes/userRoutes.js
'use strict';

const express               = require('express');
const { authRequired }      = require('../middlewares/authMiddleware');
const { getProfile, getGameHistory, getBalance }  = require('../controllers/userController');

const router = express.Router();

router.get('/me', authRequired, getProfile);
router.get('/balance', authRequired, getBalance);
router.get('/game-history', authRequired, getGameHistory);

module.exports = router;
