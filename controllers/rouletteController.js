const pool = require('../config/db');
const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const BET_TYPES = {
  STRAIGHT: 'straight',
  RED: 'red',
  BLACK: 'black',
  ODD: 'odd',
  EVEN: 'even',
  LOW: 'low',
  HIGH: 'high',
  DOZEN_1ST: 'dozen_1st',
  DOZEN_2ND: 'dozen_2nd',
  DOZEN_3RD: 'dozen_3rd',
  COLUMN_1ST: 'column_1st',
  COLUMN_2ND: 'column_2nd',
  COLUMN_3RD: 'column_3rd'
};

exports.initGame = async (req, res) => {
  try {
    const { userId } = req.user;

    const balance = await balanceService.getOrCreateBalance(userId);
    const betLimits = gameFactory.getBetLimits('roulette');

    return res.json({
      success: true,
      balance,
      minBet: betLimits.minBet,
      maxBet: betLimits.maxBet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al inicializar el juego'
    });
  }
};

exports.addBet = (req, res) => {
  try {
    const { amount, betType, betValue } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Apuesta inválida'
      });
    }

    const bet = {
      id: Date.now(),
      amount: amount,
      type: betType,
      value: betValue,
      timestamp: new Date()
    };

    res.json({
      ok: true,
      bet: bet,
      message: 'Apuesta registrada'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al registrar apuesta'
    });
  }
};

exports.spin = async (req, res) => {
  try {
    const { bets } = req.body;
    const userId = req.user.userId;

    if (!bets || bets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe tener al menos una apuesta'
      });
    }

    const currentBalance = await balanceService.getOrCreateBalance(userId);

    const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (!await balanceService.canBet(userId, totalBet)) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    await balanceService.updateBalance(userId, -totalBet);

    const wheelNumber = Math.floor(Math.random() * 37);
    
    let winnings = 0;
    const winningBets = [];

    bets.forEach(bet => {
      const isWinning = checkBetWin(bet, wheelNumber);
      
      if (isWinning) {
        const payout = calculatePayout(bet);
        winnings += bet.amount * payout;
        winningBets.push({
          type: bet.type,
          amount: bet.amount,
          payout: payout,
          win: bet.amount * payout
        });
      }
    });

    if (winnings > 0) {
      await balanceService.updateBalance(userId, winnings);
    }

    const newBalance = await balanceService.getBalance(userId);
    const gameResult = winnings > totalBet ? 'win' : (winnings === totalBet ? 'tie' : 'loss');
    const gameData = {
      wheelNumber: wheelNumber,
      wheelColor: getNumberColor(wheelNumber),
      bets: bets,
      winningBets: winningBets
    };

    await saveGameResult(
      userId,
      'roulette',
      totalBet,
      winnings,
      gameResult,
      gameData
    );

    res.json({
      success: true,
      wheelNumber: wheelNumber,
      wheelColor: getNumberColor(wheelNumber),
      totalBet: totalBet,
      totalWin: winnings,
      winningBets: winningBets,
      newBalance: newBalance,
      result: winnings > 0 ? 'Ganaste' : 'Perdiste',
      message: winnings > 0 ? `¡GANASTE! +$${winnings}` : 'Perdiste esta ronda'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al girar la ruleta'
    });
  }
};

function checkBetWin(bet, wheelNumber) {
  switch (bet.type) {
    case BET_TYPES.STRAIGHT:
      return bet.value === wheelNumber;
    
    case BET_TYPES.RED:
      return RED_NUMBERS.includes(wheelNumber);
    
    case BET_TYPES.BLACK:
      return BLACK_NUMBERS.includes(wheelNumber);
    
    case BET_TYPES.ODD:
      return wheelNumber !== 0 && wheelNumber % 2 === 1;
    
    case BET_TYPES.EVEN:
      return wheelNumber !== 0 && wheelNumber % 2 === 0;
    
    case BET_TYPES.LOW:
      return wheelNumber >= 1 && wheelNumber <= 18;
    
    case BET_TYPES.HIGH:
      return wheelNumber >= 19 && wheelNumber <= 36;
    
    case BET_TYPES.DOZEN_1ST:
      return wheelNumber >= 1 && wheelNumber <= 12;
    
    case BET_TYPES.DOZEN_2ND:
      return wheelNumber >= 13 && wheelNumber <= 24;
    
    case BET_TYPES.DOZEN_3RD:
      return wheelNumber >= 25 && wheelNumber <= 36;
    
    case BET_TYPES.COLUMN_1ST:
      return wheelNumber > 0 && wheelNumber % 3 === 1;
    
    case BET_TYPES.COLUMN_2ND:
      return wheelNumber > 0 && wheelNumber % 3 === 2;
    
    case BET_TYPES.COLUMN_3RD:
      return wheelNumber > 0 && wheelNumber % 3 === 0;
    
    default:
      return false;
  }
}

function calculatePayout(bet) {
  switch (bet.type) {
    case BET_TYPES.STRAIGHT:
      return 36;
    case BET_TYPES.DOZEN_1ST:
    case BET_TYPES.DOZEN_2ND:
    case BET_TYPES.DOZEN_3RD:
    case BET_TYPES.COLUMN_1ST:
    case BET_TYPES.COLUMN_2ND:
    case BET_TYPES.COLUMN_3RD:
      return 2;
    case BET_TYPES.RED:
    case BET_TYPES.BLACK:
    case BET_TYPES.ODD:
    case BET_TYPES.EVEN:
    case BET_TYPES.LOW:
    case BET_TYPES.HIGH:
      return 1;
    default:
      return 0;
  }
}

function getNumberColor(number) {
  if (number === 0) return 'green';
  if (RED_NUMBERS.includes(number)) return 'red';
  return 'black';
}

exports.getWheelInfo = (req, res) => {
  res.json({
    ok: true,
    numbers: ROULETTE_NUMBERS,
    redNumbers: RED_NUMBERS,
    blackNumbers: BLACK_NUMBERS,
    betTypes: BET_TYPES
  });
};
