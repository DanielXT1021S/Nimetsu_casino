'use strict';

const SlotsGame = require('./games/SlotsGame');
const BlackjackGame = require('./games/BlackjackGame');
const RouletteGame = require('./games/RouletteGame');
const PokerGame = require('./games/PokerGame');
const CrapsGame = require('./games/CrapsGame');
const BaccaratGame = require('./games/BaccaratGame');

class GameFactory {
  constructor() {
    if (GameFactory.instance) {
      return GameFactory.instance;
    }

    this.gameInstances = {
      slots: null,
      blackjack: null,
      roulette: null,
      poker: null,
      craps: null,
      baccarat: null
    };

    this.gameConstructors = {
      slots: SlotsGame,
      blackjack: BlackjackGame,
      roulette: RouletteGame,
      poker: PokerGame,
      craps: CrapsGame,
      baccarat: BaccaratGame
    };

    GameFactory.instance = this;
  }

  createGame(gameId) {
    if (!this.gameConstructors.hasOwnProperty(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }

    if (this.gameInstances[gameId] === null) {
      const GameClass = this.gameConstructors[gameId];
      this.gameInstances[gameId] = new GameClass();
    }

    return this.gameInstances[gameId];
  }

  getAllGameInstances() {
    const allGames = {};
    for (const gameId in this.gameConstructors) {
      allGames[gameId] = this.createGame(gameId);
    }
    return allGames;
  }

  getAllGames() {
    return Object.keys(this.gameConstructors).map(gameId => {
      const game = this.createGame(gameId);
      return game.getInfo();
    });
  }

  getGamesByCategory(category) {
    return Object.keys(this.gameConstructors)
      .map(gameId => this.createGame(gameId))
      .filter(game => game.category === category)
      .map(game => game.getInfo());
  }

  gameExists(gameId) {
    return this.gameConstructors.hasOwnProperty(gameId);
  }

  getBetLimits(gameId) {
    if (!this.gameExists(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }
    const game = this.createGame(gameId);
    return game.getBetLimits();
  }

  validateBet(gameId, betAmount) {
    if (!this.gameExists(gameId)) {
      return { valid: false, error: 'Juego no encontrado' };
    }
    const game = this.createGame(gameId);
    return game.validateBet(betAmount);
  }

  getGameInfo(gameId) {
    if (!this.gameExists(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }
    const game = this.createGame(gameId);
    return game.getConfig();
  }

  registerGameType(gameId, GameClass) {
    const Game = require('./games/Game');
    if (!(GameClass.prototype instanceof Game)) {
      throw new Error('La clase debe extender Game');
    }
    this.gameConstructors[gameId] = GameClass;
    this.gameInstances[gameId] = null;
  }

  static getInstance() {
    if (!GameFactory.instance) {
      new GameFactory();
    }
    return GameFactory.instance;
  }
}

module.exports = new GameFactory();
