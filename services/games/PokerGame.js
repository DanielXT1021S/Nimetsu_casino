'use strict';

const Game = require('./Game');

class PokerGame extends Game {
  constructor() {
    super({
      id: 'poker',
      title: 'Poker ♠️',
      name: 'Poker',
      description: 'Forma la mejor mano de 3 cartas',
      minBet: 10,
      maxBet: 10000,
      rtp: 98.2,
      category: 'cartas',
      features: ['ante-bonus', 'fold', 'play'],
      rules: [
        'Poker de 3 cartas contra el dealer',
        'Haz la apuesta Ante para recibir cartas',
        'Decide si juegas (Play) o te retiras (Fold)',
        'Play cuesta lo mismo que Ante',
        'Dealer debe tener Q o mejor para calificar',
        'Ante Bonus se paga independientemente de ganar'
      ],
      payouts: {
        straightFlush: 5,
        threeOfKind: 4,
        straight: 1,
        antePay: 1,
        playPay: 1
      }
    });

    this.handRankings = [
      { name: 'Escalera de Color', rank: 5, bonus: 5 },
      { name: 'Trío', rank: 4, bonus: 4 },
      { name: 'Escalera', rank: 3, bonus: 1 },
      { name: 'Color', rank: 2, bonus: 0 },
      { name: 'Par', rank: 1, bonus: 0 },
      { name: 'Carta Alta', rank: 0, bonus: 0 }
    ];
  }

  getHandRankings() {
    return JSON.parse(JSON.stringify(this.handRankings));
  }

  getConfig() {
    const config = super.getConfig();
    config.handRankings = this.getHandRankings();
    return config;
  }
}

module.exports = PokerGame;
