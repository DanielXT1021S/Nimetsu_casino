'use strict';

const gameFactory = require('../services/gameFactory');

async function renderGamePage(req, res) {
  try {
    const { gameId } = req.params;
    
    if (!gameFactory.gameExists(gameId)) {
      return res.status(404).send('Juego no encontrado');
    }

    const game = gameFactory.createGame(gameId);

    if (gameId === 'blackjack') {
      return res.render('blackjack', {
        title: game.title,
        gameId,
      });
    }

    return res.render('game', {
      title: game.title,
      gameId,
      game,
    });
  } catch (err) {
    return res.status(500).send('Error al cargar el juego');
  }
}

module.exports = {
  renderGamePage,
};