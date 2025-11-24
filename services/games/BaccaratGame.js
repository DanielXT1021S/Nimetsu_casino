'use strict';

const Game = require('./Game');

class BaccaratGame extends Game {
  constructor() {
    super({
      id: 'baccarat',
      title: 'Baccarat',
      name: 'Baccarat',
      description: 'Juego clásico de cartas de casino',
      minBet: 10,
      maxBet: 10000,
      rtp: 98.9,
      category: 'cartas',
      features: ['player-bet', 'banker-bet', 'tie-bet'],
      rules: [
        'Apuesta en Jugador, Banca o Empate',
        'La mano más cercana a 9 gana',
        'Cartas del 2-9 valen su número',
        'Ases valen 1, figuras valen 0',
        'Si la suma pasa de 10, se resta 10'
      ],
      payouts: {
        player: 2,
        banker: 1.95,
        tie: 9
      }
    });
  }
}

module.exports = BaccaratGame;
