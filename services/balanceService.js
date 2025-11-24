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

  async getFullBalance(userId) {
    const [rows] = await pool.query(
      'SELECT balance, locked FROM balances WHERE userId = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) return null;
    return { balance: rows[0].balance, locked: rows[0].locked };
  }

  async setBalance(userId, newBalance) {
    await pool.query(
      'UPDATE balances SET balance = ? WHERE userId = ?',
      [newBalance, userId]
    );

    return newBalance;
  }

  async setLocked(userId, lockedAmount) {
    await pool.query(
      'UPDATE balances SET locked = ? WHERE userId = ?',
      [lockedAmount, userId]
    );

    return lockedAmount;
  }

  async updateLocked(userId, diff) {
    const [rows] = await pool.query(
      'SELECT locked FROM balances WHERE userId = ? LIMIT 1',
      [userId]
    );
    
    if (!rows.length) {
      throw new Error('BALANCE_NOT_FOUND');
    }

    const current = rows[0].locked;
    const updated = current + diff;

    if (updated < 0) {
      throw new Error('INVALID_LOCKED_AMOUNT');
    }

    await pool.query(
      'UPDATE balances SET locked = ? WHERE userId = ?',
      [updated, userId]
    );

    return updated;
  }

  async getOrCreateFullBalance(userId) {
    let balanceData = await this.getFullBalance(userId);
    
    if (balanceData === null) {
      await this.createBalance(userId, 0);
      balanceData = { balance: 0, locked: 0 };
    }

    return balanceData;
  }
}

module.exports = new BalanceService();
