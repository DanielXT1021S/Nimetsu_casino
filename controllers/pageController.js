'use strict';

const gameFactory = require('../services/gameFactory');

function renderLogin(req, res) {
  res.render('login', {
    title: 'Iniciar sesión - Nimetsu Casino',
  });
}

function renderDashboard(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  res.render('dashboard', {
    title: 'Dashboard - Nimetsu Casino',
    user: req.user
  });
}

function renderRecharge(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  res.render('recharge', {
    title: 'Depositar Fondos - Nimetsu Casino',
    user: req.user
  });
}

function renderBlackjack(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  const game = gameFactory.createGame('blackjack');
  res.render('blackjack', {
    title: game.title + ' - Nimetsu Casino',
    game: game,
    user: req.user
  });
}

function renderRoulette(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  const game = gameFactory.createGame('roulette');
  res.render('roulette', {
    title: game.title + ' - Nimetsu Casino',
    game: game,
    user: req.user
  });
}

function renderSlots(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  const game = gameFactory.createGame('slots');
  res.render('slots', {
    title: game.title + ' - Nimetsu Casino',
    game: game,
    user: req.user
  });
}

function renderPoker(req, res) {
  if (!req.user || !req.user.userId) {
    return res.redirect('/login');
  }
  
  const game = gameFactory.createGame('poker');
  res.render('poker', {
    title: game.title + ' - Nimetsu Casino',
    game: game,
    user: req.user
  });
}

function redirectHome(req, res) {
  if (req.cookies && req.cookies.nimetsuCasinoToken) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
}

module.exports = {
  renderLogin,
  renderDashboard,
  renderRecharge,
  renderBlackjack,
  renderRoulette,
  renderSlots,
  renderPoker,
  redirectHome,
};
