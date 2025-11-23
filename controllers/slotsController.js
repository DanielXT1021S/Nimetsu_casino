'use strict';

const pool = require('../config/db');
const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

const SYMBOLS = ['🍎', '🍊', '🍋', '🍇', '💎', '👑', '7️⃣', '🌟'];

const PAYOUTS = {
  '🌟': { 5: 500, 4: 100, 3: 20 },
  '7️⃣': { 5: 250, 4: 75, 3: 15 },
  '👑': { 5: 100, 4: 50, 3: 10 },
  '💎': { 5: 75, 4: 40, 3: 8 },
  '🍇': { 5: 50, 4: 25, 3: 6 },
  '🍎': { 5: 25, 4: 15, 3: 5 },
  '🍊': { 5: 25, 4: 15, 3: 5 },
  '🍋': { 5: 25, 4: 15, 3: 5 },
};

function toNumber(n) {
  if (typeof n === 'number') return n;
  if (typeof n === 'string') return Number(n);
  return 0;
}

function getUserId(req) {
  const u = req.user || {};
  return u.userId || u.id || u.uid;
}

exports.initSlots = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        ok: false,
        message: 'Usuario no autenticado',
      });
    }

    const balance = await balanceService.getOrCreateBalance(userId);
    const betLimits = gameFactory.getBetLimits('slots');
    const gameConfig = gameFactory.createGame('slots');
    const totalBalance = balance;

    const resp = {
      success: true,
      ok: true,
      balance: totalBalance,
      minBet: betLimits.minBet,
      maxBet: betLimits.maxBet,
      symbols: SYMBOLS,
      payouts: gameConfig.payouts,
    };

    return res.json(resp);
  } catch (err) {
    return res.status(500).json({
      success: false,
      ok: false,
      message: 'Error al inicializar slots',
    });
  }
};

exports.spinSlots = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        ok: false,
        message: 'Usuario no autenticado',
      });
    }

    let { betAmount } = req.body;
    betAmount = parseInt(betAmount, 10);

    const betValidation = gameFactory.validateBet('slots', betAmount);
    if (!betValidation.valid) {
      return res.status(400).json({
        success: false,
        ok: false,
        message: betValidation.error,
      });
    }
    let balance = await balanceService.getOrCreateBalance(userId);

    if (!await balanceService.canBet(userId, betAmount)) {
      return res.status(400).json({
        success: false,
        ok: false,
        message: 'Balance insuficiente',
      });
    }

    const grid = [];
    for (let col = 0; col < 5; col++) {
      const column = [];
      for (let row = 0; row < 3; row++) {
        column.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      grid.push(column);
    }

    const middleRow = grid.map(col => col[1]);
    
    let winAmount = 0;
    let multiplier = 0;
    let winningCells = [];
    let resultString = '';

    const firstSymbol = middleRow[0];
    let consecutiveCount = 1;
    
    for (let i = 1; i < middleRow.length; i++) {
      if (middleRow[i] === firstSymbol) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    if (consecutiveCount >= 3 && PAYOUTS[firstSymbol]) {
      const payoutData = PAYOUTS[firstSymbol];
      multiplier = payoutData[consecutiveCount] || payoutData[3] || 0;
      
      if (multiplier > 0) {
        winAmount = betAmount * multiplier;
        resultString = `${firstSymbol} x${consecutiveCount}`;
        
        for (let i = 0; i < consecutiveCount; i++) {
          winningCells.push({ col: i, row: 1 });
        }
      }
    }

    if (!resultString) {
      resultString = 'Sin premio';
    }

    await balanceService.updateBalance(userId, -betAmount);
    if (winAmount > 0) {
      await balanceService.updateBalance(userId, winAmount);
    }

    balance = await balanceService.getBalance(userId);
    const gameResult = winAmount > 0 ? 'win' : 'loss';
    await saveGameResult(
      userId,
      'slots',
      betAmount,
      winAmount,
      gameResult,
      {
        grid,
        middleRow,
        resultString,
        multiplier,
        consecutiveCount
      }
    );

    const resp = {
      success: true,
      ok: true,
      result: { 
        grid,
        middleRow,
        winningCells
      },
      resultString,
      betAmount,
      multiplier,
      winAmount,
      isWin: winAmount > 0,
      balance: totalBalance,
    };

    return res.json(resp);
  } catch (err) {
    return res.status(500).json({
      success: false,
      ok: false,
      message: 'Error al procesar spin',
    });
  }
};

exports.slotsInfo = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        ok: false,
        message: 'Usuario no autenticado',
      });
    }

    const balance = await balanceService.getOrCreateBalance(userId);
    const totalBalance = balance;

    const resp = {
      success: true,
      ok: true,
      balance: totalBalance,
      symbols: SYMBOLS,
      payouts: PAYOUTS,
    };

    return res.json(resp);
  } catch (err) {
    return res.status(500).json({
      success: false,
      ok: false,
      message: 'Error al obtener información de slots',
    });
  }
};
