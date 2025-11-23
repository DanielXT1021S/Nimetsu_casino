// routes/authRoutes.js
'use strict';

const express = require('express');
const {
  renderLoginPage,
  register,
  login,
  renderAdminSelector,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.get('/login', renderLoginPage);
router.post('/login', login);
router.post('/register', register);
router.get('/logout', logout);

module.exports = router;
