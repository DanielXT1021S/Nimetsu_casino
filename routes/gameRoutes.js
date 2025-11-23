// routes/gameRoutes.js
'use strict';

const express = require('express');
const { renderGamePage } = require('../controllers/gameController');
const { authRequiredPage } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:gameId', authRequiredPage, renderGamePage);

module.exports = router;
