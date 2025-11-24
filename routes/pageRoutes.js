// src/routes/pageRoutes.js
'use strict';

const express = require('express');
const router  = express.Router();
const { authRequiredPage } = require('../middlewares/authMiddleware');
const {
  renderLogin,
  renderDashboard,
  renderRecharge,
  renderBlackjack,
  renderRoulette,
  renderSlots,
  renderPoker,
  redirectHome,
} = require('../controllers/pageController');

router.get('/login', renderLogin);
router.get('/dashboard', authRequiredPage, renderDashboard);
router.get('/recharge', authRequiredPage, renderRecharge);
router.get('/blackjack', authRequiredPage, renderBlackjack);
router.get('/roulette', authRequiredPage, renderRoulette);
router.get('/slots', authRequiredPage, renderSlots);
router.get('/poker', authRequiredPage, renderPoker);

router.get('/', redirectHome);

module.exports = router;
