const pool = require('../config/db');
const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

exports.initGame = async (req, res) => {
  try {
    const { userId } = req.user;

    const balance = await balanceService.getOrCreateBalance(userId);
    const game = gameFactory.createGame('roulette');
    const betLimits = game.getBetLimits();

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

    const game = gameFactory.createGame('roulette');
    const currentBalance = await balanceService.getOrCreateBalance(userId);
    const redNumbers = game.getRedNumbers();
    const blackNumbers = game.getBlackNumbers();

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
      const isWinning = checkBetWin(bet, wheelNumber, redNumbers, blackNumbers);
      
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
      wheelColor: game.getNumberColor(wheelNumber),
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
      wheelColor: game.getNumberColor(wheelNumber),
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

function checkBetWin(bet, wheelNumber, redNumbers, blackNumbers) {
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

  switch (bet.type) {
    case BET_TYPES.STRAIGHT:
      return bet.value === wheelNumber;
    
    case BET_TYPES.RED:
      return redNumbers.includes(wheelNumber);
    
    case BET_TYPES.BLACK:
      return blackNumbers.includes(wheelNumber);
    
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
  const game = gameFactory.createGame('roulette');
  if (number === 0) return 'green';
  if (game.getRedNumbers().includes(number)) return 'red';
  return 'black';
}

exports.getWheelInfo = (req, res) => {
  const game = gameFactory.createGame('roulette');
  res.json({
    ok: true,
    numbers: game.getNumbers(),
    redNumbers: game.getRedNumbers(),
    blackNumbers: game.getBlackNumbers(),
    betTypes: game.getBetTypes()
  });
};
