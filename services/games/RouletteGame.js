'use strict';

const Game = require('./Game');

class RouletteGame extends Game {
  constructor() {
    super({
      id: 'roulette',
      title: 'Ruleta',
      name: 'Ruleta',
      description: 'Apuesta en números y colores',
      minBet: 10,
      maxBet: 10000,
      rtp: 97.3,
      category: 'casino',
      features: ['multiple-bets', 'quick-bet', 'statistics'],
      rules: [
        'Ruleta europea con números del 0 al 36',
        'Puedes hacer múltiples apuestas simultáneas',
        'El 0 es verde, los demás son rojos o negros',
        'Diferentes tipos de apuesta tienen distintos pagos'
      ],
      payouts: {
        straight: 36,
        dozen: 3,
        column: 3,
        simple: 2
      }
    });

    this.numbers = Array.from({ length: 37 }, (_, i) => i);
    this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    this.blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    this.betTypes = {
      straight: { name: 'Pleno', payout: 36, description: 'Un solo número' },
      red: { name: 'Rojo', payout: 2, description: 'Cualquier número rojo' },
      black: { name: 'Negro', payout: 2, description: 'Cualquier número negro' },
      odd: { name: 'Impar', payout: 2, description: 'Números impares' },
      even: { name: 'Par', payout: 2, description: 'Números pares' },
      low: { name: 'Bajo (1-18)', payout: 2, description: 'Números del 1 al 18' },
      high: { name: 'Alto (19-36)', payout: 2, description: 'Números del 19 al 36' },
      dozen_1st: { name: 'Primera Docena', payout: 3, description: 'Números 1-12' },
      dozen_2nd: { name: 'Segunda Docena', payout: 3, description: 'Números 13-24' },
      dozen_3rd: { name: 'Tercera Docena', payout: 3, description: 'Números 25-36' },
      column_1st: { name: 'Primera Columna', payout: 3, description: 'Columna 1, 4, 7...' },
      column_2nd: { name: 'Segunda Columna', payout: 3, description: 'Columna 2, 5, 8...' },
      column_3rd: { name: 'Tercera Columna', payout: 3, description: 'Columna 3, 6, 9...' }
    };
  }

  getNumbers() {
    return [...this.numbers];
  }

  getRedNumbers() {
    return [...this.redNumbers];
  }

  getBlackNumbers() {
    return [...this.blackNumbers];
  }

  getBetTypes() {
    return JSON.parse(JSON.stringify(this.betTypes));
  }

  getNumberColor(number) {
    if (number === 0) return 'green';
    if (this.redNumbers.includes(number)) return 'red';
    return 'black';
  }

  getConfig() {
    const config = super.getConfig();
    config.numbers = this.getNumbers();
    config.redNumbers = this.getRedNumbers();
    config.blackNumbers = this.getBlackNumbers();
    config.betTypes = this.getBetTypes();
    return config;
  }
}

module.exports = RouletteGame;
