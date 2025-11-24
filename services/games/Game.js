'use strict';

/**
 * Clase abstracta base para todos los juegos
 * Define la interfaz que deben implementar todos los juegos
 */
class Game {
  constructor(config) {
    if (new.target === Game) {
      throw new TypeError('No se puede instanciar Game directamente. Use las subclases específicas.');
    }

    this.id = config.id;
    this.title = config.title;
    this.name = config.name;
    this.description = config.description;
    this.minBet = config.minBet;
    this.maxBet = config.maxBet;
    this.rtp = config.rtp; // Return to Player
    this.category = config.category;
    this.features = config.features || [];
    this.rules = config.rules || [];
    this.payouts = config.payouts || {};
  }

  /**
   * Obtiene información básica del juego
   */
  getInfo() {
    return {
      id: this.id,
      title: this.title,
      name: this.name,
      description: this.description,
      minBet: this.minBet,
      maxBet: this.maxBet,
      rtp: this.rtp,
      category: this.category,
      features: this.features,
      rules: this.rules
    };
  }

  /**
   * Obtiene los límites de apuesta del juego
   */
  getBetLimits() {
    return {
      minBet: this.minBet,
      maxBet: this.maxBet
    };
  }

  /**
   * Valida si una apuesta es válida
   */
  validateBet(betAmount) {
    if (typeof betAmount !== 'number' || isNaN(betAmount)) {
      return { valid: false, error: 'Monto inválido' };
    }

    if (betAmount < this.minBet) {
      return { valid: false, error: `Apuesta mínima: $${this.minBet}` };
    }

    if (betAmount > this.maxBet) {
      return { valid: false, error: `Apuesta máxima: $${this.maxBet}` };
    }

    return { valid: true };
  }

  /**
   * Retorna una copia profunda del objeto de payouts
   */
  getPayouts() {
    return JSON.parse(JSON.stringify(this.payouts));
  }

  /**
   * Obtiene la configuración completa del juego
   */
  getConfig() {
    return {
      id: this.id,
      title: this.title,
      name: this.name,
      description: this.description,
      minBet: this.minBet,
      maxBet: this.maxBet,
      rtp: this.rtp,
      category: this.category,
      features: this.features,
      rules: this.rules,
      payouts: this.getPayouts()
    };
  }
}

module.exports = Game;
