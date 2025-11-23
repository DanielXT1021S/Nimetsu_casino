// services/gameFactory.js
'use strict';

class GameFactory {
  constructor() {
    if (GameFactory.instance) {
      return GameFactory.instance;
    }

    this.games = {
      slots: {
        id: 'slots',
        title: 'Slots 🎰',
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
      },

      blackjack: {
        id: 'blackjack',
        title: 'Blackjack 🃏',
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
      },

      roulette: {
        id: 'roulette',
        title: 'Ruleta 🎡',
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
        betTypes: {
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
        },
        payouts: {
          straight: 36,
          dozen: 3,
          column: 3,
          simple: 2
        }
      },

      poker: {
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
        handRankings: [
          { name: 'Escalera de Color', rank: 5, bonus: 5 },
          { name: 'Trío', rank: 4, bonus: 4 },
          { name: 'Escalera', rank: 3, bonus: 1 },
          { name: 'Color', rank: 2, bonus: 0 },
          { name: 'Par', rank: 1, bonus: 0 },
          { name: 'Carta Alta', rank: 0, bonus: 0 }
        ],
        payouts: {
          straightFlush: 5,
          threeOfKind: 4,
          straight: 1,
          antePay: 1,
          playPay: 1
        }
      },

      craps: {
        id: 'craps',
        title: 'Dados 🎲',
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
      },

      baccarat: {
        id: 'baccarat',
        title: 'Baccarat 💎',
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
      }
    };

    GameFactory.instance = this;
  }

  createGame(gameId) {
    const game = this.games[gameId];
    
    if (!game) {
      return null;
    }

    return JSON.parse(JSON.stringify(game));
  }

  getAllGames() {
    return Object.values(this.games).map(game => ({
      id: game.id,
      title: game.title,
      name: game.name,
      description: game.description,
      minBet: game.minBet,
      maxBet: game.maxBet,
      rtp: game.rtp,
      category: game.category
    }));
  }

  getGamesByCategory(category) {
    return Object.values(this.games)
      .filter(game => game.category === category)
      .map(game => ({
        id: game.id,
        title: game.title,
        name: game.name,
        description: game.description,
        minBet: game.minBet,
        maxBet: game.maxBet,
        rtp: game.rtp
      }));
  }

  gameExists(gameId) {
    return this.games.hasOwnProperty(gameId);
  }

  getBetLimits(gameId) {
    const game = this.games[gameId];
    
    if (!game) {
      return null;
    }

    return {
      minBet: game.minBet,
      maxBet: game.maxBet
    };
  }

  validateBet(gameId, betAmount) {
    const game = this.games[gameId];
    
    if (!game) {
      return { valid: false, error: 'Juego no encontrado' };
    }

    if (typeof betAmount !== 'number' || isNaN(betAmount)) {
      return { valid: false, error: 'Monto inválido' };
    }

    if (betAmount < game.minBet) {
      return { valid: false, error: `Apuesta mínima: $${game.minBet}` };
    }

    if (betAmount > game.maxBet) {
      return { valid: false, error: `Apuesta máxima: $${game.maxBet}` };
    }

    return { valid: true };
  }

  getGameInfo(gameId) {
    return this.createGame(gameId);
  }

  registerGame(gameId, gameConfig) {
    this.games[gameId] = {
      id: gameId,
      title: gameConfig.title || gameId,
      name: gameConfig.name || gameId,
      description: gameConfig.description || '',
      minBet: gameConfig.minBet || 10,
      maxBet: gameConfig.maxBet || 10000,
      rtp: gameConfig.rtp || 95,
      category: gameConfig.category || 'casino',
      features: gameConfig.features || [],
      rules: gameConfig.rules || [],
      payouts: gameConfig.payouts || {},
      ...gameConfig
    };
  }
}

module.exports = new GameFactory();
