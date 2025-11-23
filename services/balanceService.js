// services/balanceService.js
'use strict';

const pool = require('../config/db');

class BalanceService {
  constructor() {

    if (BalanceService.instance) {
      return BalanceService.instance;
    }

    this.minBalance = 0;

    BalanceService.instance = this;
  }

  async getBalance(userId) {
    const [rows] = await pool.query(
      'SELECT balance FROM balances WHERE userId = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) return null;
    return rows[0].balance;
  }

  async canBet(userId, amount) {
    if (!amount || amount <= 0) return false;

    const balance = await this.getBalance(userId);
    if (balance === null) return false;

    return balance >= amount;
  }

  async updateBalance(userId, diff) {
    const [rows] = await pool.query(
      'SELECT balance FROM balances WHERE userId = ? LIMIT 1',
      [userId]
    );
    
    if (!rows.length) {
      throw new Error('BALANCE_NOT_FOUND');
    }

    const current = rows[0].balance;
    const updated = current + diff;

    if (updated < this.minBalance) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    await pool.query(
      'UPDATE balances SET balance = ? WHERE userId = ?',
      [updated, userId]
    );

    return updated;
  }

  async createBalance(userId, initialBalance = 0) {
    await pool.query(
      'INSERT INTO balances (userId, balance, locked) VALUES (?, ?, 0)',
      [userId, initialBalance]
    );

    return initialBalance;
  }

  async getOrCreateBalance(userId) {
    let balance = await this.getBalance(userId);
    
    if (balance === null) {
      balance = await this.createBalance(userId, 0);
    }

    return balance;
  }
}

module.exports = new BalanceService();
