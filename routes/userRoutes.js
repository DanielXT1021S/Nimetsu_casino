// src/routes/userRoutes.js
'use strict';

const express               = require('express');
const { authRequired }      = require('../middlewares/authMiddleware');
const { getProfile, getGameHistory }  = require('../controllers/userController');

const router = express.Router();

router.get('/me', authRequired, getProfile);
router.get('/game-history', authRequired, getGameHistory);

module.exports = router;
