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

    const symbolWeights = {
      '🍎': 15, '🍊': 15, '🍋': 15, '🍇': 12,
      '💎': 8, '👑': 6, '🌟': 4, '7️⃣': 2
    };

    const getWeightedSymbol = () => {
      const totalWeight = Object.values(symbolWeights).reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      
      for (const [symbol, weight] of Object.entries(symbolWeights)) {
        random -= weight;
        if (random <= 0) return symbol;
      }
      return symbols[0];
    };

    const grid = [];
    for (let col = 0; col < 5; col++) {
      const column = [];
      for (let row = 0; row < 3; row++) {
        column.push(getWeightedSymbol());
      }
      grid.push(column);
    }

    const lines = [
      { name: 'top', cells: grid.map((col, i) => ({ col: i, row: 0, symbol: col[0] })) },
      { name: 'middle', cells: grid.map((col, i) => ({ col: i, row: 1, symbol: col[1] })) },
      { name: 'bottom', cells: grid.map((col, i) => ({ col: i, row: 2, symbol: col[2] })) },
      { name: 'diag_down', cells: [
        { col: 0, row: 0, symbol: grid[0][0] },
        { col: 1, row: 1, symbol: grid[1][1] },
        { col: 2, row: 1, symbol: grid[2][1] },
        { col: 3, row: 1, symbol: grid[3][1] },
        { col: 4, row: 2, symbol: grid[4][2] }
      ]},
      { name: 'diag_up', cells: [
        { col: 0, row: 2, symbol: grid[0][2] },
        { col: 1, row: 1, symbol: grid[1][1] },
        { col: 2, row: 1, symbol: grid[2][1] },
        { col: 3, row: 1, symbol: grid[3][1] },
        { col: 4, row: 0, symbol: grid[4][0] }
      ]}
    ];

    let bestWin = { winAmount: 0, multiplier: 0, cells: [], line: '', count: 0, symbol: '' };

    for (const line of lines) {
      const firstSymbol = line.cells[0].symbol;
      let consecutiveCount = 1;
      
      for (let i = 1; i < line.cells.length; i++) {
        if (line.cells[i].symbol === firstSymbol) {
          consecutiveCount++;
        } else {
          break;
        }
      }

      if (consecutiveCount >= 3 && payouts[firstSymbol]) {
        const payoutData = payouts[firstSymbol];
        const multiplier = payoutData[consecutiveCount] || payoutData[3] || 0;
        
        if (multiplier > 0) {
          const winAmount = betAmount * multiplier;
         
          if (winAmount > bestWin.winAmount) {
            bestWin = {
              winAmount,
              multiplier,
              cells: line.cells.slice(0, consecutiveCount),
              line: line.name,
              count: consecutiveCount,
              symbol: firstSymbol
            };
          }
        }
      }
    }

    const winAmount = bestWin.winAmount;
    const multiplier = bestWin.multiplier;
    const winningCells = bestWin.cells.map(c => ({ col: c.col, row: c.row }));
    const resultString = winAmount > 0 
      ? `${bestWin.symbol} x${bestWin.count} (${bestWin.line})`
      : 'Sin premio';

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
        resultString,
        multiplier,
        winningLine: bestWin.line,
        consecutiveCount: bestWin.count
      }
    );

    const resp = {
      success: true,
      ok: true,
      result: { 
        grid,
        winningCells,
        winningLine: bestWin.line
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
