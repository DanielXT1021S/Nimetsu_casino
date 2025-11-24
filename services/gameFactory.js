'use strict';

const SlotsGame = require('./games/SlotsGame');
const BlackjackGame = require('./games/BlackjackGame');
const RouletteGame = require('./games/RouletteGame');
const PokerGame = require('./games/PokerGame');
const CrapsGame = require('./games/CrapsGame');
const BaccaratGame = require('./games/BaccaratGame');

/**
 * GameFactory - Implementa el patrón Factory Method
 * Responsable de crear instancias de juegos específicos
 * Utiliza Singleton para mantener una única instancia de cada juego
 */
class GameFactory {
  constructor() {
    if (GameFactory.instance) {
      return GameFactory.instance;
    }

    // Cache de instancias singleton para cada juego
    this.gameInstances = {
      slots: null,
      blackjack: null,
      roulette: null,
      poker: null,
      craps: null,
      baccarat: null
    };

    // Mapeo de tipos de juego a sus constructores
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

  /**
   * Factory Method - Crea o retorna una instancia de juego
   * Implementa patrón Singleton para cada juego
   * @param {string} gameId - ID del juego a crear
   * @returns {Game} Instancia del juego solicitado
   */
  createGame(gameId) {
    if (!this.gameConstructors.hasOwnProperty(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }

    // Si ya existe una instancia, retornarla (Singleton)
    if (this.gameInstances[gameId] === null) {
      const GameClass = this.gameConstructors[gameId];
      this.gameInstances[gameId] = new GameClass();
    }

    return this.gameInstances[gameId];
  }

  /**
   * Obtiene todas las instancias de juegos
   * @returns {Object} Objeto con todas las instancias de juegos
   */
  getAllGameInstances() {
    const allGames = {};
    for (const gameId in this.gameConstructors) {
      allGames[gameId] = this.createGame(gameId);
    }
    return allGames;
  }

  /**
   * Obtiene información resumida de todos los juegos
   * @returns {Array} Array con información de todos los juegos
   */
  getAllGames() {
    return Object.keys(this.gameConstructors).map(gameId => {
      const game = this.createGame(gameId);
      return game.getInfo();
    });
  }

  /**
   * Filtra juegos por categoría
   * @param {string} category - Categoría del juego
   * @returns {Array} Array de juegos en esa categoría
   */
  getGamesByCategory(category) {
    return Object.keys(this.gameConstructors)
      .map(gameId => this.createGame(gameId))
      .filter(game => game.category === category)
      .map(game => game.getInfo());
  }

  /**
   * Verifica si un juego existe
   * @param {string} gameId - ID del juego
   * @returns {boolean}
   */
  gameExists(gameId) {
    return this.gameConstructors.hasOwnProperty(gameId);
  }

  /**
   * Obtiene los límites de apuesta de un juego
   * @param {string} gameId - ID del juego
   * @returns {Object} Objeto con minBet y maxBet
   */
  getBetLimits(gameId) {
    if (!this.gameExists(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }
    const game = this.createGame(gameId);
    return game.getBetLimits();
  }

  /**
   * Valida una apuesta para un juego específico
   * @param {string} gameId - ID del juego
   * @param {number} betAmount - Monto de la apuesta
   * @returns {Object} Objeto con validez y mensaje de error si aplica
   */
  validateBet(gameId, betAmount) {
    if (!this.gameExists(gameId)) {
      return { valid: false, error: 'Juego no encontrado' };
    }
    const game = this.createGame(gameId);
    return game.validateBet(betAmount);
  }

  /**
   * Obtiene información completa de un juego
   * @param {string} gameId - ID del juego
   * @returns {Object} Configuración completa del juego
   */
  getGameInfo(gameId) {
    if (!this.gameExists(gameId)) {
      throw new Error(`Juego no encontrado: ${gameId}`);
    }
    const game = this.createGame(gameId);
    return game.getConfig();
  }

  /**
   * Registra un nuevo tipo de juego dinámicamente
   * @param {string} gameId - ID del juego
   * @param {Function} GameClass - Clase del juego (debe extender Game)
   */
  registerGameType(gameId, GameClass) {
    const Game = require('./games/Game');
    if (!(GameClass.prototype instanceof Game)) {
      throw new Error('La clase debe extender Game');
    }
    this.gameConstructors[gameId] = GameClass;
    this.gameInstances[gameId] = null;
  }

  /**
   * Obtiene la instancia de Factory (Singleton)
   * @returns {GameFactory}
   */
  static getInstance() {
    if (!GameFactory.instance) {
      new GameFactory();
    }
    return GameFactory.instance;
  }
}

module.exports = new GameFactory();
