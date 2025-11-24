'use strict';

const Game = require('./Game');

class CrapsGame extends Game {
  constructor() {
    super({
      id: 'craps',
      title: 'Dados',
      name: 'Craps',
      description: 'Lanza los dados y gana',
      minBet: 10,
      maxBet: 10000,
      rtp: 98.6,
      category: 'casino',
      features: ['pass-line', 'dont-pass', 'field-bets'],
      rules: [
        'Juego clásico de dados de casino',
        'Apuesta en el resultado de dos dados',
        'Múltiples tipos de apuestas disponibles',
        'Pass Line es la apuesta básica'
      ],
      payouts: {
        passLine: 2,
        dontPass: 2,
        field: 2,
        any7: 5,
        any11: 16
      }
    });
  }
}

module.exports = CrapsGame;
