'use strict';

const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

async function initGame(req, res) {
  try {
    const { userId } = req.user;

    const balance = await balanceService.getOrCreateBalance(userId);
    const game = gameFactory.createGame('poker');
    const betLimits = game.getBetLimits();
    const handRankings = game.getHandRankings();

    return res.json({
      success: true,
      balance,
      minBet: betLimits.minBet,
      maxBet: betLimits.maxBet,
      anteBonus: handRankings.reduce((acc, hand) => {
        if (hand.bonus) acc[hand.name] = hand.bonus;
        return acc;
      }, {}),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al inicializar el juego',
    });
  }
}

async function placeAnte(req, res) {
  try {
    const { userId } = req.user;
    const { ante } = req.body;

    const game = gameFactory.createGame('poker');
    const betValidation = game.validateBet(ante);
    if (!betValidation.valid) {
      return res.status(400).json({
        success: false,
        message: betValidation.error,
      });
    }

    const currentBalance = await balanceService.getOrCreateBalance(userId);

    if (!await balanceService.canBet(userId, ante * 2)) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente. Necesitas el doble del Ante para jugar.',
      });
    }

    const newBalance = await balanceService.updateBalance(userId, -ante);

    const playerHand = generateCards(3);

    return res.json({
      success: true,
      playerHand,
      ante,
      newBalance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al realizar apuesta',
    });
  }
}

async function playHand(req, res) {
  try {
    const { userId } = req.user;
    const { ante, playerHand } = req.body;

    if (!ante || !playerHand || !Array.isArray(playerHand) || playerHand.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
      });
    }

    const isValidHand = playerHand.every(card => 
      card && typeof card === 'object' && card.suit && card.rank
    );

    if (!isValidHand) {
      return res.status(400).json({
        success: false,
        message: 'Cartas inválidas',
      });
    }

    const currentBalance = await balanceService.getOrCreateBalance(userId);

    if (currentBalance < ante) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para Play',
      });
    }

    await balanceService.updateBalance(userId, -ante);

    const dealerHand = generateCards(3);

    const playerResult = evaluateHand(playerHand);
    const dealerResult = evaluateHand(dealerHand);
    const dealerQualifies = checkDealerQualifies(dealerHand);

    let totalWin = 0;
    let result = '';
    let anteBonus = 0;

    const ANTE_BONUS = {
      'STRAIGHT_FLUSH': 5,
      'THREE_OF_A_KIND': 4,
      'STRAIGHT': 1,
    };

    if (ANTE_BONUS[playerResult.name]) {
      anteBonus = ante * ANTE_BONUS[playerResult.name];
      totalWin += anteBonus;
    }

    if (!dealerQualifies) {
  
      result = 'Dealer no califica';
      totalWin += ante; 
      totalWin += ante; 
    } else if (playerResult.ranking > dealerResult.ranking) {
      result = 'Ganaste';
      totalWin += ante * 2;
      totalWin += ante * 2;
    } else if (playerResult.ranking === dealerResult.ranking) {
      const comparison = compareHighCards(playerHand, dealerHand);
      if (comparison > 0) {
        result = 'Ganaste';
        totalWin += ante * 2;
        totalWin += ante * 2;
      } else if (comparison < 0) {
        result = 'Dealer gana';
      } else {
        result = 'Empate';
        totalWin += ante * 2;
      }
    } else {
      result = 'Dealer gana';
      totalWin += ante; 
    }

 
    if (totalWin > 0) {
      await balanceService.updateBalance(userId, totalWin);
    }

   
    const newBalance = await balanceService.getBalance(userId);

    const totalBet = ante * 2; 
    let gameResult = 'loss';
    if (result === 'Ganaste') gameResult = 'win';
    else if (result === 'Empate') gameResult = 'tie';

    await saveGameResult(
      userId,
      'poker',
      totalBet,
      totalWin,
      gameResult,
      {
        playerHand,
        dealerHand,
        playerHandType: playerResult.displayName,
        dealerHandType: dealerResult.displayName,
        dealerQualifies,
        anteBonus,
        resultMessage: result
      }
    );

    return res.json({
      success: true,
      dealerHand,
      playerResult,
      dealerResult,
      dealerQualifies,
      result,
      totalWin,
      anteBonus,
      newBalance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al jugar',
    });
  }
}

async function foldHand(req, res) {
  try {
    const { userId } = req.user;
    const { ante, playerHand } = req.body;

    const balance = await balanceService.getBalance(userId);

    if (ante && playerHand) {
      const playerResult = evaluateHand(playerHand);
      await saveGameResult(
        userId,
        'poker',
        ante,
        0,
        'loss',
        {
          playerHand,
          playerHandType: playerResult.displayName,
          resultMessage: 'Te retiraste',
          folded: true
        }
      );
    }

    return res.json({
      success: true,
      result: 'Te retiraste',
      balance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al retirarse',
    });
  }
}

function drawCard() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  
  return { suit, rank };
}

function generateCards(count) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(drawCard());
  }
  return cards;
}

function evaluateHand(hand) {
  const HAND_RANKINGS = {
    STRAIGHT_FLUSH: 5,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 3,
    FLUSH: 2,
    PAIR: 1,
    HIGH_CARD: 0,
  };

  const ranks = hand.map(card => card.rank);
  const suits = hand.map(card => card.suit);
  
  const rankCounts = {};
  ranks.forEach(rank => {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  });
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const isFlush = suits.every(suit => suit === suits[0]);
  const isStraight = checkStraight(ranks);
  
  if (isFlush && isStraight) {
    return { name: 'STRAIGHT_FLUSH', ranking: HAND_RANKINGS.STRAIGHT_FLUSH, displayName: 'Escalera de Color' };
  }
  
  if (counts[0] === 3) {
    return { name: 'THREE_OF_A_KIND', ranking: HAND_RANKINGS.THREE_OF_A_KIND, displayName: 'Trío' };
  }
  
  if (isStraight) {
    return { name: 'STRAIGHT', ranking: HAND_RANKINGS.STRAIGHT, displayName: 'Escalera' };
  }
  
  if (isFlush) {
    return { name: 'FLUSH', ranking: HAND_RANKINGS.FLUSH, displayName: 'Color' };
  }
  
  if (counts[0] === 2) {
    return { name: 'PAIR', ranking: HAND_RANKINGS.PAIR, displayName: 'Par' };
  }
  
  return { name: 'HIGH_CARD', ranking: HAND_RANKINGS.HIGH_CARD, displayName: 'Carta Alta' };
}

function checkStraight(ranks) {
  const rankValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  
  const values = ranks.map(rank => rankValues[rank]).sort((a, b) => a - b);
  
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== 1) {
      if (values.includes(14) && values.includes(2) && values.includes(3)) {
        return true;
      }
      return false;
    }
  }
  
  return true;
}

function checkDealerQualifies(hand) {
  const rankValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  
  const handResult = evaluateHand(hand);
  
  if (handResult.ranking > 0) {
    return true;
  }
  
  const highCard = Math.max(...hand.map(card => rankValues[card.rank]));
  return highCard >= 12;
}

function compareHighCards(hand1, hand2) {
  const rankValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  
  const values1 = hand1.map(card => rankValues[card.rank]).sort((a, b) => b - a);
  const values2 = hand2.map(card => rankValues[card.rank]).sort((a, b) => b - a);
  
  for (let i = 0; i < values1.length; i++) {
    if (values1[i] > values2[i]) return 1;
    if (values1[i] < values2[i]) return -1;
  }
  
  return 0;
}

async function joinTable(req, res) {
  try {
    const { userId } = req.user;
    let { buyIn } = req.body;

    buyIn = parseFloat(buyIn);

    if (!buyIn || buyIn <= 0 || isNaN(buyIn)) {
      return res.status(400).json({
        ok: false,
        message: 'Buy-in inválido'
      });
    }

    const game = gameFactory.createGame('poker');
    const betLimits = game.getBetLimits();

    if (buyIn < betLimits.minBet || buyIn > betLimits.maxBet) {
      return res.status(400).json({
        ok: false,
        message: `Buy-in debe estar entre ${betLimits.minBet} y ${betLimits.maxBet}`
      });
    }

    const canBet = await balanceService.canBet(userId, buyIn);
    if (!canBet) {
      return res.status(400).json({
        ok: false,
        message: 'Saldo insuficiente'
      });
    }

    const tableId = `table_${Date.now()}_${userId}`;

    return res.json({
      ok: true,
      tableId,
      chips: buyIn,
      message: 'Te uniste a la mesa de poker'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: 'Error al unirse a la mesa'
    });
  }
}

module.exports = {
  initGame,
  placeAnte,
  playHand,
  foldHand,
  joinTable,
};
