// routes/pokerRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/authMiddleware');
const { initGame, placeAnte, playHand, foldHand, joinTable } = require('../controllers/pokerController');

router.get('/init', authRequired, initGame);
router.post('/ante', authRequired, placeAnte);
router.post('/play', authRequired, playHand);
router.post('/fold', authRequired, foldHand);
router.post('/join', authRequired, joinTable);

module.exports = router;
