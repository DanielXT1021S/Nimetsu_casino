'use strict';

const Game = require('./Game');

class BlackjackGame extends Game {
  constructor() {
    super({
      id: 'blackjack',
      title: 'Blackjack',
      name: 'Blackjack',
      description: 'Suma 21 y vence al crupier',
      minBet: 5,
      maxBet: 5000,
      rtp: 99.5,
      category: 'cartas',
      features: ['double', 'split', 'insurance'],
      rules: [
        'El objetivo es llegar a 21 sin pasarse',
        'Blackjack (21 en 2 cartas) paga 2.5x',
        'El dealer pide hasta 17 o más',
        'Si te pasas de 21, pierdes automáticamente',
        'En caso de empate, recuperas tu apuesta'
      ],
      payouts: {
        blackjack: 2.5,
        win: 2,
        push: 1,
        loss: 0
      }
    });
  }
}

module.exports = BlackjackGame;
