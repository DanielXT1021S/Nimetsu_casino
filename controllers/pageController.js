'use strict';

const gameFactory = require('../services/gameFactory');

function renderLogin(req, res) {
  res.render('login', {
    title: 'Iniciar sesión - Nimetsu Casino',
  });
}

function renderDashboard(req, res) {
  res.render('dashboard', {
    title: 'Dashboard - Nimetsu Casino',
  });
}

function renderRecharge(req, res) {
  res.render('recharge', {
    title: 'Depositar Fondos - Nimetsu Casino',
  });
}

function renderBlackjack(req, res) {
  const game = gameFactory.createGame('blackjack');
  res.render('blackjack', {
    title: game.title + ' - Nimetsu Casino',
    game: game
  });
}

function renderRoulette(req, res) {
  const game = gameFactory.createGame('roulette');
  res.render('roulette', {
    title: game.title + ' - Nimetsu Casino',
    game: game
  });
}

function renderSlots(req, res) {
  const game = gameFactory.createGame('slots');
  res.render('slots', {
    title: game.title + ' - Nimetsu Casino',
    game: game
  });
}

function renderPoker(req, res) {
  const game = gameFactory.createGame('poker');
  res.render('poker', {
    title: game.title + ' - Nimetsu Casino',
    game: game
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
