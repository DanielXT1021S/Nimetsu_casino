'use strict';

const pool = require('../config/db');
const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

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
    const game = gameFactory.createGame('slots');
    const betLimits = game.getBetLimits();
    const symbols = game.getSymbols();
    const payouts = game.getPayouts();

    const resp = {
      success: true,
      ok: true,
      balance: balance,
      minBet: betLimits.minBet,
      maxBet: betLimits.maxBet,
      symbols: symbols,
      payouts: payouts,
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

    const game = gameFactory.createGame('slots');
    const betValidation = game.validateBet(betAmount);
    if (!betValidation.valid) {
      return res.status(400).json({
        success: false,
        ok: false,
        message: betValidation.error,
      });
    }

    const balance = await balanceService.getOrCreateBalance(userId);
    const symbols = game.getSymbols();
    const payouts = game.getPayouts();

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
        column.push(symbols[Math.floor(Math.random() * symbols.length)]);
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

    if (consecutiveCount >= 3 && payouts[firstSymbol]) {
      const payoutData = payouts[firstSymbol];
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

    const newBalance = await balanceService.getBalance(userId);
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
      balance: newBalance,
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
    const game = gameFactory.createGame('slots');
    const symbols = game.getSymbols();
    const payouts = game.getPayouts();

    const resp = {
      success: true,
      ok: true,
      balance: balance,
      symbols: symbols,
      payouts: payouts,
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
