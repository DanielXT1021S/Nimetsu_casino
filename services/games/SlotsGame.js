'use strict';

const Game = require('./Game');

class SlotsGame extends Game {
  constructor() {
    super({
      id: 'slots',
      title: 'Slots',
      name: 'Slots',
      description: 'Juega a las máquinas tragaperras',
      minBet: 10,
      maxBet: 10000,
      rtp: 96,
      category: 'casino',
      features: ['autoplay', 'turbo', 'paylines'],
      rules: [
        'Consigue 3 o más símbolos iguales en línea',
        'La línea del medio es la que paga',
        'Símbolos especiales dan mayores premios',
        'El multiplicador depende del símbolo'
      ],
      payouts: {
        '🌟': { 5: 500, 4: 100, 3: 20 },
        '7️⃣': { 5: 250, 4: 75, 3: 15 },
        '👑': { 5: 100, 4: 50, 3: 10 },
        '💎': { 5: 75, 4: 40, 3: 8 },
        '🍇': { 5: 50, 4: 25, 3: 6 },
        '🍎': { 5: 25, 4: 15, 3: 5 },
        '🍊': { 5: 25, 4: 15, 3: 5 },
        '🍋': { 5: 25, 4: 15, 3: 5 }
      }
    });

    this.symbols = ['🍎', '🍊', '🍋', '🍇', '💎', '👑', '7️⃣', '🌟'];
  }

  getSymbols() {
    return [...this.symbols];
  }

  getConfig() {
    const config = super.getConfig();
    config.symbols = this.getSymbols();
    return config;
  }
}

module.exports = SlotsGame;
