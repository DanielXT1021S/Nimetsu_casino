// routes/blackjackRoutes.js
'use strict';

const express = require('express');
const { authRequired } = require('../middlewares/authMiddleware');
const { initGame, hit, stand } = require('../controllers/blackjackController');

const router = express.Router();

router.post('/init', authRequired, initGame);
router.post('/hit', authRequired, hit);
router.post('/stand', authRequired, stand);

module.exports = router;
