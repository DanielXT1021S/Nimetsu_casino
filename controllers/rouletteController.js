const pool = require('../config/db');
const crypto = require('crypto');
const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

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

exports.bet = async (req, res) => {
  try {
    const { userId } = req.user;
    let { betType, betAmount } = req.body;

    betAmount = parseFloat(betAmount);

    if (!betAmount || betAmount <= 0 || isNaN(betAmount)) {
      return res.status(400).json({
        ok: false,
        message: 'Monto inválido'
      });
    }

    const game = gameFactory.createGame('roulette');
    const betLimits = game.getBetLimits();

    if (betAmount < betLimits.minBet || betAmount > betLimits.maxBet) {
      return res.status(400).json({
        ok: false,
        message: `Apuesta debe estar entre ${betLimits.minBet} y ${betLimits.maxBet}`
      });
    }

    const validBetTypes = ['red', 'black', 'odd', 'even', 'low', 'high', 'dozen_1st', 'dozen_2nd', 'dozen_3rd'];
    if (!validBetTypes.includes(betType)) {
      return res.status(400).json({
        ok: false,
        message: 'Tipo de apuesta inválido'
      });
    }

    const canBet = await balanceService.canBet(userId, betAmount);
    if (!canBet) {
      return res.status(400).json({
        ok: false,
        message: 'Saldo insuficiente'
      });
    }

    await balanceService.updateBalance(userId, -betAmount);

    const wheelNumber = Math.floor(Math.random() * 37);
    const redNumbers = game.getRedNumbers();
    const color = wheelNumber === 0 ? 'green' : (redNumbers.includes(wheelNumber) ? 'red' : 'black');

    let isWin = false;
    if (betType === 'red') isWin = color === 'red';
    else if (betType === 'black') isWin = color === 'black';
    else if (betType === 'odd') isWin = wheelNumber !== 0 && wheelNumber % 2 === 1;
    else if (betType === 'even') isWin = wheelNumber !== 0 && wheelNumber % 2 === 0;
    else if (betType === 'low') isWin = wheelNumber >= 1 && wheelNumber <= 18;
    else if (betType === 'high') isWin = wheelNumber >= 19 && wheelNumber <= 36;
    else if (betType === 'dozen_1st') isWin = wheelNumber >= 1 && wheelNumber <= 12;
    else if (betType === 'dozen_2nd') isWin = wheelNumber >= 13 && wheelNumber <= 24;
    else if (betType === 'dozen_3rd') isWin = wheelNumber >= 25 && wheelNumber <= 36;

    let winAmount = 0;
    if (isWin) {
      const payout = betType.startsWith('dozen') ? 2 : 1;
      winAmount = betAmount * (1 + payout);
      await balanceService.updateBalance(userId, winAmount);
    }

    const newBalance = await balanceService.getBalance(userId);

    await saveGameResult(
      userId,
      'roulette',
      betAmount,
      winAmount,
      isWin ? 'win' : 'loss',
      { wheelNumber, color, betType }
    );

    return res.json({
      ok: true,
      winningNumber: wheelNumber,
      color,
      result: isWin ? 'win' : 'loss',
      winAmount,
      newBalance
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al procesar apuesta'
    });
  }
};

exports.spin = async (req, res) => {
  let connection;
  
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
    const redNumbers = game.getRedNumbers();
    const blackNumbers = game.getBlackNumbers();

    const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

    connection = await pool.getConnection();
    
    await connection.beginTransaction();

    const [balanceRows] = await connection.query(
      'SELECT balance FROM balances WHERE userId = ? FOR UPDATE',
      [userId]
    );

    if (!balanceRows.length) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Usuario sin saldo configurado'
      });
    }

    const currentBalance = balanceRows[0].balance;

    if (currentBalance < totalBet) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    await connection.query(
      'UPDATE balances SET balance = balance - ? WHERE userId = ?',
      [totalBet, userId]
    );

    const wheelNumber = crypto.randomInt(0, 37);
    
    let winnings = 0;
    const winningBets = [];

    bets.forEach(bet => {
      const isWinning = checkBetWin(bet, wheelNumber, redNumbers, blackNumbers);
      
      if (isWinning) {
        const payout = calculatePayout(bet);
        const totalWin = bet.amount + (bet.amount * payout);
        winnings += totalWin;
        winningBets.push({
          type: bet.type,
          amount: bet.amount,
          payout: payout,
          win: totalWin
        });
      }
    });

    if (winnings > 0) {
      await connection.query(
        'UPDATE balances SET balance = balance + ? WHERE userId = ?',
        [winnings, userId]
      );
    }

    const [newBalanceRows] = await connection.query(
      'SELECT balance FROM balances WHERE userId = ?',
      [userId]
    );
    const newBalance = newBalanceRows[0].balance;

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

    await connection.commit();
    connection.release();

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

    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar el giro. Tu saldo no fue afectado.'
    });
  }
};

function checkBetWin(bet, wheelNumber, redNumbers, blackNumbers) {
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
