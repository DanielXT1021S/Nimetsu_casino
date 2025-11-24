'use strict';

const { saveGameResult } = require('./userController');
const balanceService = require('../services/balanceService');
const gameFactory = require('../services/gameFactory');

async function initGame(req, res) {
  try {
    const { userId } = req.user;
    const { bet } = req.body;

    const game = gameFactory.createGame('blackjack');
    const betValidation = game.validateBet(bet);
    if (!betValidation.valid) {
      return res.status(400).json({
        ok: false,
        message: betValidation.error,
      });
    }

    const currentBalance = await balanceService.getOrCreateBalance(userId);

    if (currentBalance < bet) {
      return res.status(400).json({
        ok: false,
        message: 'Saldo insuficiente',
      });
    }

    const playerHand = drawCards(2);
    const dealerHand = drawCards(2);

    const playerBlackjack = isBlackjack(playerHand);
    const dealerBlackjack = isBlackjack(dealerHand);

    let betToDeduct = bet;
    
    if (playerBlackjack && dealerBlackjack) {
      betToDeduct = 0;
    } 
    else if (playerBlackjack) {
      betToDeduct = bet;
    }

    let newBalance = currentBalance;
    if (betToDeduct > 0) {
      newBalance = await balanceService.updateBalance(userId, -betToDeduct);
    }
    const playerValue = calculateHand(playerHand);
    const dealerValue = calculateHand(dealerHand);

    if (playerBlackjack || dealerBlackjack) {
      let gameResult = 'tie';
      let winAmount = 0;
      let resultMessage = '';

      if (playerBlackjack && dealerBlackjack) {
        gameResult = 'tie';
        winAmount = bet; 
        resultMessage = 'Ambos tienen Blackjack - Empate';
      } else if (playerBlackjack) {
        gameResult = 'win';
        winAmount = Math.floor(bet * 2.5);
        resultMessage = 'Blackjack!';
      } else {
        gameResult = 'loss';
        winAmount = 0;
        resultMessage = 'Dealer tiene Blackjack';
      }

      await saveGameResult(
        userId,
        'blackjack',
        bet,
        winAmount,
        gameResult,
        {
          playerHand,
          dealerHand,
          playerValue,
          dealerValue,
          resultMessage,
          initialBlackjack: true,
          playerBlackjack,
          dealerBlackjack
        }
      );
    }

    return res.json({
      ok: true,
      bet,
      playerHand,
      dealerHand,
      playerValue,
      dealerValue,
      playerBlackjack,
      dealerBlackjack,
      newBalance,
    });
  } catch (err) {
    
    return res.status(500).json({
      ok: false,
      message: 'Error al inicializar el juego',
    });
  }
}

async function hit(req, res) {
  try {
    const { userId } = req.user;
    const { playerHand, dealerHand, bet } = req.body;

    if (!playerHand || !dealerHand || !bet) {
      return res.status(400).json({
        ok: false,
        message: 'Datos incompletos',
      });
    }

    const newCard = drawCards(1)[0];
    playerHand.push(newCard);

    const playerValue = calculateHand(playerHand);
    const isBust = playerValue > 21;

    if (isBust) {
      const newBalance = await balanceService.getBalance(userId);

      await saveGameResult(
        userId,
        'blackjack',
        bet,
        0,
        'loss',
        {
          playerHand,
          playerValue,
          dealerHand,
          resultMessage: 'Te pasaste',
          bust: true
        }
      );

      return res.json({
        ok: true,
        playerHand,
        playerValue,
        bust: true,
        newBalance,
      });
    }

    return res.json({
      ok: true,
      playerHand,
      playerValue,
      bust: false,
    });
  } catch (err) {
    
    return res.status(500).json({
      ok: false,
      message: 'Error al pedir carta',
    });
  }
}

async function stand(req, res) {
  try {
    const { userId } = req.user;
    const { playerHand, dealerHand, bet } = req.body;

    if (!playerHand || !dealerHand || !bet) {
      return res.status(400).json({
        ok: false,
        message: 'Datos incompletos',
      });
    }

    console.log(`[BLACKJACK STAND] Jugador: ${getHandDescription(playerHand)} | Dealer: ${getHandDescription(dealerHand)}`);
    
    let dealer = [...dealerHand];
    let dealerValue = calculateHand(dealer);

    console.log(`[BLACKJACK] Dealer comienza con: ${getHandDescription(dealer)} = ${dealerValue}`);

    // El dealer debe pedir cartas mientras tenga 16 o menos (Hard rule: 17+)
    while (dealerValue < 17) {
      const newCard = drawCards(1)[0];
      dealer.push(newCard);
      dealerValue = calculateHand(dealer);
      
      console.log(`[BLACKJACK] Dealer pidió: ${newCard.rank}${newCard.suit} → Mano: ${getHandDescription(dealer)} = ${dealerValue}`);
    }
    
    // Una vez que dealer tiene 17 o más, se planta
    console.log(`[BLACKJACK] Dealer se planta con ${dealerValue} (${getHandDescription(dealer)})`);
    
    if (dealerValue > 21) {
      console.log(`[BLACKJACK] ¡DEALER BUST! (${dealerValue})`);
    }

    const playerValue = calculateHand(playerHand);

    let result = determineWinner(playerValue, dealerValue, playerHand);
    let winAmount = 0;

    if (result === 'blackjack') {
      winAmount = Math.floor(bet * 2.5);
      await balanceService.updateBalance(userId, winAmount);
    } else if (result === 'win') {
      winAmount = Math.floor(bet * 2);
      await balanceService.updateBalance(userId, winAmount);
    } else if (result === 'push') {
      winAmount = bet;
      await balanceService.updateBalance(userId, bet);
    }

    const newBalance = await balanceService.getBalance(userId);
    let gameResult = 'loss';
    if (result === 'win' || result === 'blackjack') gameResult = 'win';
    else if (result === 'push') gameResult = 'tie';

    // Generar mensaje de resultado descriptivo
    let resultMessage = 'Dealer gana';
    if (result === 'blackjack') {
      resultMessage = '¡Blackjack Natural!';
    } else if (result === 'win') {
      if (dealerValue > 21) {
        resultMessage = '¡El dealer se pasó! ¡Ganaste!';
      } else {
        resultMessage = '¡Ganaste la mano!';
      }
    } else if (result === 'push') {
      resultMessage = 'Empate - Ambos tienen la misma puntuación';
    } else if (result === 'lose') {
      if (playerValue > 21) {
        resultMessage = 'Te pasaste de 21';
      } else {
        resultMessage = 'Perdiste - El dealer tiene mejor mano';
      }
    }

    await saveGameResult(
      userId,
      'blackjack',
      bet,
      winAmount,
      gameResult,
      {
        playerHand,
        dealerHand: dealer,
        playerValue,
        dealerValue,
        resultMessage,
        dealerBust: dealerValue > 21,
        playerBust: playerValue > 21,
        isBlackjack: result === 'blackjack'
      }
    );

    return res.json({
      ok: true,
      result,
      playerValue,
      dealerValue,
      dealerHand: dealer,
      winAmount,
      newBalance,
      resultMessage,
    });
  } catch (err) {
    console.error('Stand error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al procesar la jugada',
    });
  }
}

function drawCards(count) {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const cards = [];

  for (let i = 0; i < count; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    cards.push({ suit, rank });
  }

  return cards;
}

function calculateHand(hand) {
  let total = 0;
  let aces = 0;

  // Contar todas las cartas y los ases
  for (let card of hand) {
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
      total += 10;
    } else {
      const numValue = parseInt(card.rank);
      if (!isNaN(numValue)) {
        total += numValue;
      }
    }
  }

  // Ajustar ases de 11 a 1 si el total se pasa de 21
  while (total > 21 && aces > 0) {
    total -= 10;  // Cambiar un as de 11 a 1 (resta 10 del total)
    aces--;
  }

  return total;
}

function isBlackjack(hand) {
  if (hand.length !== 2) return false;
  const values = hand.map(card => {
    if (card.rank === 'A') return 11;
    if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') return 10;
    return parseInt(card.rank);
  });
  return (values[0] + values[1] === 21);
}

function getHandDescription(hand) {
  // Función helper para debugging
  return hand.map(card => `${card.rank}${card.suit}`).join(', ');
}

function determineWinner(playerValue, dealerValue, playerHand) {
  // Si el jugador se pasó, pierde siempre
  if (playerValue > 21) {
    return 'lose';
  }

  // Si el dealer se pasó, el jugador gana
  if (dealerValue > 21) {
    return 'win';
  }

  // Comparar valores cuando ambos están dentro de 21
  if (playerValue > dealerValue) {
    // Blackjack natural (As + 10) solo con 2 cartas
    if (playerValue === 21 && playerHand.length === 2) {
      return 'blackjack';
    }
    return 'win';
  } else if (playerValue === dealerValue) {
    return 'push';
  } else {
    // dealer tiene más que el jugador
    return 'lose';
  }
}

module.exports = {
  initGame,
  hit,
  stand,
};
