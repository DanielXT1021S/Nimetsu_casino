// public/js/poker.js - Poker de 3 Cartas con Dealer
'use strict';

// Game state
const gameState = {
  balance: 0,
  currentAnte: 100,
  isPlaying: false,
  playerHand: null,
  minBet: 10,
  maxBet: 10000,
  gamePhase: 'WAITING_ANTE', // WAITING_ANTE, WAITING_DECISION
};

// DOM elements
const balanceAmount = document.getElementById('balanceAmount');
const betAmountInput = document.getElementById('betAmountInput');
const anteBtn = document.getElementById('anteBtn');
const playBtn = document.getElementById('playBtn');
const foldBtn = document.getElementById('foldBtn');
const clearBtn = document.getElementById('clearBtn');
const increaseBetBtn = document.getElementById('increaseBetBtn');
const decreaseBetBtn = document.getElementById('decreaseBetBtn');
const toggleChipsBtn = document.getElementById('toggleChipsBtn');
const chipsSection = document.getElementById('chipsSection');
const betDisplayGroup = document.querySelector('.bet-display-group');
const compactBetDisplay = document.querySelector('.compact-bet-display');
const compactBetAmount = document.getElementById('compactBetAmount');
const handResult = document.getElementById('handResult');
const dealerResult = document.getElementById('dealerResult');
const winOverlay = document.getElementById('winOverlay');
const winAmount = document.getElementById('winAmount');
const winHand = document.getElementById('winHand');
const loseOverlay = document.getElementById('loseOverlay');
const loseAmount = document.getElementById('loseAmount');
const loseMessage = document.getElementById('loseMessage');
const toast = document.getElementById('toast');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const payoutSidebar = document.getElementById('payoutSidebar');
const togglePayoutBtn = document.getElementById('togglePayoutBtn');

// Modales
const rulesModal = document.getElementById('rulesModal');
const rulesModalOverlay = document.getElementById('rulesModalOverlay');
const rulesModalClose = document.getElementById('rulesModalClose');
const rulesModalBody = document.getElementById('rulesModalBody');
const rulesModalTitle = document.getElementById('rulesModalTitle');

const prizesModal = document.getElementById('prizesModal');
const prizesModalOverlay = document.getElementById('prizesModalOverlay');
const prizesModalClose = document.getElementById('prizesModalClose');
const prizesModalBody = document.getElementById('prizesModalBody');

// Botones del menú
const rulesBtn = document.getElementById('rulesBtn');
const prizesBtn = document.getElementById('prizesBtn');

// Variables para control de doble clic en fichas
let lastChipClickTime = 0;
let lastChipValue = null;
const DOUBLE_CLICK_DELAY = 400; // ms

// Estado del panel de fichas
let chipsExpanded = false;

// Inicializar juego
async function initGame() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    
    const response = await fetch('/poker/init', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      showToast(data.message || 'Error al cargar el juego');
      return;
    }

    gameState.balance = data.balance;
    gameState.minBet = data.minBet;
    gameState.maxBet = data.maxBet;
    gameState.currentAnte = 100;

    // Inicializar estado colapsado en móvil
    if (chipsSection) {
        chipsSection.classList.add('collapsed');
    }
    if (toggleChipsBtn) {
        toggleChipsBtn.classList.add('collapsed');
    }
    if (betDisplayGroup) {
        betDisplayGroup.classList.add('collapsed');
    }
    if (compactBetDisplay) {
        compactBetDisplay.classList.add('show');
    }

    updateBalance();
    updateCurrentBetDisplay();
    setupEventListeners();
    resetGame();
    
  } catch (error) {
    console.error('Error al inicializar:', error);
    showToast('Error de conexión');
  }
}

// Fase 1: Apuesta Ante y recibir cartas
async function handleAnte() {
  if (gameState.isPlaying) return;

  const ante = parseInt(betAmountInput.value);
  
  if (!ante || ante < gameState.minBet || ante > gameState.maxBet) {
    showToast(`Apuesta debe estar entre $${gameState.minBet} y $${gameState.maxBet}`);
    return;
  }

  // Verificar que tenga saldo para Ante + Play (el doble)
  if (ante * 2 > gameState.balance) {
    showToast('Saldo insuficiente. Necesitas el doble del Ante para jugar.');
    return;
  }

  gameState.isPlaying = true;
  gameState.currentAnte = ante;
  anteBtn.disabled = true;
  
  updateCurrentBetDisplay();
  handResult.textContent = 'Repartiendo cartas...';

  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    
    const response = await fetch('/poker/ante', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ante }),
    });

    const data = await response.json();

    if (!data.success) {
      showToast(data.message || 'Error al apostar');
      gameState.isPlaying = false;
      anteBtn.disabled = false;
      return;
    }

    // Guardar mano del jugador
    gameState.playerHand = data.playerHand;
    gameState.balance = data.newBalance;
    updateBalance();

    console.log('Mano del jugador guardada:', gameState.playerHand);

    // Mostrar cartas del jugador con animación
    displayPlayerCards(data.playerHand);

    // Habilitar botones Play/Fold después de mostrar cartas
    setTimeout(() => {
      playBtn.disabled = false;
      foldBtn.disabled = false;
      gameState.gamePhase = 'WAITING_DECISION';
      handResult.textContent = '¿PLAY o FOLD?';
      gameState.isPlaying = false;
    }, 1500);

  } catch (error) {
    console.error('Error en Ante:', error);
    showToast('Error de conexión');
    gameState.isPlaying = false;
    anteBtn.disabled = false;
  }
}

// Fase 2: Play (doblar apuesta)
async function handlePlay() {
  if (gameState.isPlaying || gameState.gamePhase !== 'WAITING_DECISION') return;

  gameState.isPlaying = true;
  playBtn.disabled = true;
  foldBtn.disabled = true;

  handResult.textContent = 'Revelando dealer...';

  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    
    console.log('Enviando al servidor:', {
      ante: gameState.currentAnte,
      playerHand: gameState.playerHand
    });
    
    const response = await fetch('/poker/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        ante: gameState.currentAnte,
        playerHand: gameState.playerHand 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error del servidor:', errorData);
      showToast(errorData.message || 'Error al jugar');
      resetGame();
      return;
    }

    const data = await response.json();

    console.log('Respuesta del servidor:', data);

    if (!data.success) {
      showToast(data.message || 'Error al jugar');
      resetGame();
      return;
    }

    // Mostrar cartas del dealer con animación
    displayDealerCards(data.dealerHand);

    // Esperar animación y mostrar resultado
    setTimeout(() => {
      gameState.balance = data.newBalance;
      updateBalance();

      // Mostrar resultados
      handResult.textContent = data.playerResult.displayName;
      dealerResult.textContent = data.dealerResult.displayName;

      // Mostrar mensaje del juego
      let message = data.result;
      if (data.anteBonus > 0) {
        message += ` (Bonus: +$${data.anteBonus.toLocaleString()})`;
      }

      if (data.totalWin > 0) {
        showWinOverlay(data.totalWin, message);
        handResult.className = 'hand-result win';
      } else {
        handResult.className = 'hand-result';
        showToast(message);
      }

      // Resetear después de mostrar resultado
      setTimeout(() => {
        resetGame();
      }, 3000);
    }, 1500);

  } catch (error) {
    console.error('Error en Play:', error);
    showToast('Error de conexión');
    resetGame();
  }
}

// Fase 2 alternativa: Fold (retirarse)
async function handleFold() {
  if (gameState.isPlaying || gameState.gamePhase !== 'WAITING_DECISION') return;

  gameState.isPlaying = true;
  playBtn.disabled = true;
  foldBtn.disabled = true;

  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    
    const response = await fetch('/poker/fold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error del servidor:', errorData);
      showToast(errorData.message || 'Error al retirarse');
      resetGame();
      return;
    }

    const data = await response.json();

    if (data.success) {
      gameState.balance = data.balance;
      updateBalance();
      showToast('Te retiraste. Perdiste el Ante.');
    } else {
      showToast(data.message || 'Error al retirarse');
    }

    resetGame();

  } catch (error) {
    console.error('Error en Fold:', error);
    showToast('Error de conexión');
    resetGame();
  }
}

// Mostrar cartas del jugador
function displayPlayerCards(hand) {
  for (let i = 0; i < 3; i++) {
    const cardElement = document.getElementById(`card${i}`);
    cardElement.className = 'card';
    cardElement.innerHTML = '<div class="card-back"></div>';
  }

  hand.forEach((card, index) => {
    setTimeout(() => {
      const cardElement = document.getElementById(`card${index}`);
      const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
      
      cardElement.classList.add('flip');
      
      setTimeout(() => {
        cardElement.innerHTML = `
          <div class="card-front ${color}">
            <div class="card-corner top-left">
              <div class="rank">${card.rank}</div>
              <div class="suit">${card.suit}</div>
            </div>
            <div class="card-center">
              <div class="suit-large">${card.suit}</div>
            </div>
            <div class="card-corner bottom-right">
              <div class="rank">${card.rank}</div>
              <div class="suit">${card.suit}</div>
            </div>
          </div>
        `;
      }, 300);
    }, index * 400);
  });
}

// Mostrar cartas del dealer
function displayDealerCards(hand) {
  for (let i = 0; i < 3; i++) {
    const cardElement = document.getElementById(`dealerCard${i}`);
    cardElement.className = 'card';
    cardElement.innerHTML = '<div class="card-back"></div>';
  }

  hand.forEach((card, index) => {
    setTimeout(() => {
      const cardElement = document.getElementById(`dealerCard${index}`);
      const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
      
      cardElement.classList.add('flip');
      
      setTimeout(() => {
        cardElement.innerHTML = `
          <div class="card-front ${color}">
            <div class="card-corner top-left">
              <div class="rank">${card.rank}</div>
              <div class="suit">${card.suit}</div>
            </div>
            <div class="card-center">
              <div class="suit-large">${card.suit}</div>
            </div>
            <div class="card-corner bottom-right">
              <div class="rank">${card.rank}</div>
              <div class="suit">${card.suit}</div>
            </div>
          </div>
        `;
      }, 300);
    }, index * 400);
  });
}

// Resetear juego
function resetGame() {
  gameState.isPlaying = false;
  gameState.playerHand = null;
  gameState.gamePhase = 'WAITING_ANTE';
  
  anteBtn.disabled = false;
  playBtn.disabled = true;
  foldBtn.disabled = true;
  
  handResult.textContent = 'Haz tu apuesta ANTE para comenzar';
  handResult.className = 'hand-result';
  dealerResult.textContent = '';
  
  // Resetear cartas a reverso
  for (let i = 0; i < 3; i++) {
    const playerCard = document.getElementById(`card${i}`);
    const dealerCard = document.getElementById(`dealerCard${i}`);
    
    playerCard.className = 'card';
    playerCard.innerHTML = '<div class="card-back"></div>';
    dealerCard.className = 'card';
    dealerCard.innerHTML = '<div class="card-back"></div>';
  }
}

// Limpiar apuesta
function clearBet() {
  betAmount.value = gameState.minBet;
  gameState.currentAnte = gameState.minBet;
  updateCurrentBetDisplay();
}

// Actualizar balance
function updateBalance() {
  if (balanceAmount) {
    balanceAmount.textContent = `$${gameState.balance.toLocaleString()}`;
  }
  const menuBalance = document.getElementById('menuBalance');
  if (menuBalance) {
    menuBalance.textContent = `$${gameState.balance.toLocaleString()}`;
  }
}

// Actualizar display de apuesta actual
function updateCurrentBetDisplay() {
  if (betAmountInput) {
    betAmountInput.value = gameState.currentAnte;
  }
  if (compactBetAmount) {
    compactBetAmount.textContent = `$${gameState.currentAnte.toLocaleString()}`;
  }
}

// Limpiar apuesta
function clearBet() {
  gameState.currentAnte = 10;
  updateCurrentBetDisplay();
  showToast('Apuesta restablecida a $10', 'info');
}

// Establecer apuesta
function setBet(amount, accumulate = false) {
  let newBet;
  
  if (accumulate) {
    newBet = gameState.currentAnte + parseInt(amount);
  } else {
    newBet = parseInt(amount);
  }
  
  if (isNaN(newBet) || newBet < gameState.minBet) {
    gameState.currentAnte = gameState.minBet;
    showToast(`Apuesta mínima: $${gameState.minBet}`, 'warning');
  } else if (newBet > gameState.maxBet) {
    gameState.currentAnte = gameState.maxBet;
    showToast(`Apuesta máxima: $${gameState.maxBet}`, 'warning');
  } else if (newBet > gameState.balance) {
    gameState.currentAnte = Math.min(gameState.balance, gameState.maxBet);
    showToast('Saldo insuficiente', 'error');
  } else {
    gameState.currentAnte = newBet;
  }
  
  updateCurrentBetDisplay();
  
  // Actualizar estado visual de las fichas
  document.querySelectorAll('.casino-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
}

// Toggle panel de fichas
function toggleChipsPanel() {
  chipsExpanded = !chipsExpanded;
  
  const compactHeader = document.querySelector('.compact-bet-header');
  
  if (chipsExpanded) {
    chipsSection.classList.remove('collapsed');
    toggleChipsBtn.classList.remove('collapsed');
    if (betDisplayGroup) {
      betDisplayGroup.classList.remove('collapsed');
    }
    if (compactBetDisplay) {
      compactBetDisplay.classList.remove('show');
    }
    if (compactHeader) {
      compactHeader.classList.add('expanded');
    }
  } else {
    chipsSection.classList.add('collapsed');
    toggleChipsBtn.classList.add('collapsed');
    if (betDisplayGroup) {
      betDisplayGroup.classList.add('collapsed');
    }
    if (compactBetDisplay) {
      compactBetDisplay.classList.add('show');
    }
    if (compactHeader) {
      compactHeader.classList.remove('expanded');
    }
  }
}

// Mostrar overlay de victoria
function showWinOverlay(amount, message) {
  winAmount.textContent = `+$${amount.toLocaleString()}`;
  winHand.textContent = message;
  winOverlay.classList.add('show');

  setTimeout(() => {
    winOverlay.classList.remove('show');
  }, 3000);
}

// Mostrar toast
function showToast(message, type = 'info') {
  const messageElement = toast.querySelector('.toast-message');
  messageElement.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Mostrar overlay de pérdida
function showLoseOverlay(amount, message) {
  if (loseAmount) {
    loseAmount.textContent = `-$${amount.toLocaleString()}`;
  }
  if (loseMessage) {
    loseMessage.textContent = message;
  }
  if (loseOverlay) {
    loseOverlay.classList.add('show');
    setTimeout(() => {
      loseOverlay.classList.remove('show');
    }, 3000);
  }
}

// Menú lateral
function openMenu() {
  if (sideMenu) {
    sideMenu.classList.add('open');
  }
  if (menuOverlay) {
    menuOverlay.classList.add('active');
  }
}

function closeMenu() {
  if (sideMenu) {
    sideMenu.classList.remove('open');
  }
  if (menuOverlay) {
    menuOverlay.classList.remove('active');
  }
}

// Abrir modal de reglas
function openRulesModal() {
  if (!rulesModal) return;
  
  rulesModalBody.innerHTML = `
    <h3><i class="fas fa-gamepad"></i> Objetivo del Juego</h3>
    <p>En el Poker de 3 Cartas, tu objetivo es obtener una mano mejor que la del dealer. El juego se desarrolla en dos fases:</p>
    
    <h3><i class="fas fa-coins"></i> Cómo Jugar</h3>
    <ol>
        <li><strong>Apuesta ANTE:</strong> Haz tu apuesta inicial para recibir 3 cartas</li>
        <li><strong>Revisa tus cartas:</strong> El dealer también recibe 3 cartas (boca abajo)</li>
        <li><strong>Decide:</strong>
            <ul>
                <li><strong>PLAY:</strong> Apuesta adicional igual al ANTE para enfrentar al dealer</li>
                <li><strong>FOLD:</strong> Retirarte y perder tu apuesta ANTE</li>
            </ul>
        </li>
        <li><strong>Resolución:</strong> Las cartas del dealer se revelan y se comparan las manos</li>
    </ol>
    
    <h3><i class="fas fa-hand-holding-heart"></i> Ranking de Manos (Mayor a Menor)</h3>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Mano</th>
                <th>Descripción</th>
                <th>Ejemplo</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Escalera de Color</strong></td>
                <td>3 cartas consecutivas del mismo palo</td>
                <td>5♥ 6♥ 7♥</td>
            </tr>
            <tr>
                <td><strong>Trío</strong></td>
                <td>3 cartas del mismo valor</td>
                <td>8♠ 8♥ 8♦</td>
            </tr>
            <tr>
                <td><strong>Escalera</strong></td>
                <td>3 cartas consecutivas de cualquier palo</td>
                <td>9♣ 10♦ J♠</td>
            </tr>
            <tr>
                <td><strong>Color</strong></td>
                <td>3 cartas del mismo palo (no consecutivas)</td>
                <td>2♥ 7♥ K♥</td>
            </tr>
            <tr>
                <td><strong>Par</strong></td>
                <td>2 cartas del mismo valor</td>
                <td>Q♠ Q♥ 4♦</td>
            </tr>
            <tr>
                <td><strong>Carta Alta</strong></td>
                <td>Ninguna combinación anterior</td>
                <td>A♣ 5♦ 9♠</td>
            </tr>
        </tbody>
    </table>
    
    <h3><i class="fas fa-crown"></i> Calificación del Dealer</h3>
    <p>El dealer debe tener al menos <strong>Reina (Q) o mejor</strong> para calificar:</p>
    <ul>
        <li><strong>Si el dealer NO califica:</strong> Recuperas tu apuesta PLAY, ganas 1:1 en ANTE</li>
        <li><strong>Si el dealer califica y pierdes:</strong> Pierdes ambas apuestas (ANTE + PLAY)</li>
        <li><strong>Si el dealer califica y ganas:</strong> Ganas 1:1 en ambas apuestas</li>
    </ul>
    
    <div class="highlight-box">
        <h4><i class="fas fa-lightbulb"></i> Consejo Estratégico</h4>
        <p>La estrategia óptima es jugar (PLAY) con Q-6-4 o mejor, y retirarte (FOLD) con manos más bajas.</p>
    </div>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-exclamation-triangle"></i> Importante</h4>
        <p>Necesitas tener saldo para cubrir tanto la apuesta ANTE como la apuesta PLAY (el doble de tu ANTE inicial).</p>
    </div>
  `;
  
  rulesModal.classList.add('show');
  closeMenu();
}

function closeRulesModal() {
  if (rulesModal) {
    rulesModal.classList.remove('show');
  }
}

// Abrir modal de premios
function openPrizesModal() {
  if (!prizesModal) return;
  
  prizesModalBody.innerHTML = `
    <h3><i class="fas fa-trophy"></i> Tabla de Pagos</h3>
    <p>Los pagos en Poker de 3 Cartas se basan en la mano que obtengas:</p>
    
    <table class="prize-table">
        <thead>
            <tr>
                <th>Mano</th>
                <th>Pago ANTE Bonus</th>
                <th>Pago Standard</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><i class="fas fa-star" style="color: gold;"></i> <strong>Escalera de Color</strong></td>
                <td>5:1</td>
                <td>1:1</td>
            </tr>
            <tr>
                <td><i class="fas fa-dice-three" style="color: #9333ea;"></i> <strong>Trío</strong></td>
                <td>4:1</td>
                <td>1:1</td>
            </tr>
            <tr>
                <td><i class="fas fa-sort-numeric-up" style="color: #06b6d4;"></i> <strong>Escalera</strong></td>
                <td>1:1</td>
                <td>1:1</td>
            </tr>
            <tr>
                <td><i class="fas fa-layer-group" style="color: #10b981;"></i> <strong>Color</strong></td>
                <td>-</td>
                <td>1:1</td>
            </tr>
            <tr>
                <td><i class="fas fa-equals" style="color: #f59e0b;"></i> <strong>Par</strong></td>
                <td>-</td>
                <td>1:1</td>
            </tr>
            <tr>
                <td><i class="fas fa-hand-paper" style="color: #ef4444;"></i> <strong>Carta Alta</strong></td>
                <td>-</td>
                <td>1:1</td>
            </tr>
        </tbody>
    </table>
    
    <h3><i class="fas fa-coins"></i> Ejemplos de Pago</h3>
    <div class="highlight-box">
        <h4>Apuesta: $100 ANTE</h4>
        <ul>
            <li><strong>Escalera de Color:</strong> Ganas $500 (ANTE Bonus 5:1) + $100 (ANTE) + $100 (PLAY) = <strong>$700 total</strong></li>
            <li><strong>Trío:</strong> Ganas $400 (ANTE Bonus 4:1) + $100 (ANTE) + $100 (PLAY) = <strong>$600 total</strong></li>
            <li><strong>Escalera:</strong> Ganas $100 (ANTE Bonus 1:1) + $100 (ANTE) + $100 (PLAY) = <strong>$300 total</strong></li>
            <li><strong>Par o mejor (sin bonus):</strong> Ganas $100 (ANTE) + $100 (PLAY) = <strong>$200 total</strong></li>
        </ul>
    </div>
    
    <h3><i class="fas fa-exclamation-circle"></i> Regla del Dealer No Califica</h3>
    <p>Si el dealer no tiene al menos Q o mejor:</p>
    <ul>
        <li>Recuperas tu apuesta PLAY (empate)</li>
        <li>Ganas 1:1 en tu apuesta ANTE</li>
        <li>Aún puedes ganar el ANTE Bonus si tienes Escalera o mejor</li>
    </ul>
    
    <h3><i class="fas fa-percentage"></i> Ventaja de la Casa</h3>
    <ul>
        <li><strong>RTP (Return to Player):</strong> ~97.5%</li>
        <li><strong>Ventaja de la Casa:</strong> ~2.5%</li>
        <li>Siguiendo la estrategia óptima, es uno de los juegos de casino más favorables</li>
    </ul>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-chart-line"></i> Probabilidades Aproximadas</h4>
        <ul>
            <li>Escalera de Color: ~0.22%</li>
            <li>Trío: ~0.24%</li>
            <li>Escalera: ~3.26%</li>
            <li>Color: ~4.96%</li>
            <li>Par: ~16.94%</li>
            <li>Carta Alta: ~74.39%</li>
        </ul>
    </div>
  `;
  
  prizesModal.classList.add('show');
  closeMenu();
}

function closePrizesModal() {
  if (prizesModal) {
    prizesModal.classList.remove('show');
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Botones de acción del juego
  if (anteBtn) anteBtn.addEventListener('click', handleAnte);
  if (playBtn) playBtn.addEventListener('click', handlePlay);
  if (foldBtn) foldBtn.addEventListener('click', handleFold);
  
  // Controles de apuesta
  if (clearBtn) clearBtn.addEventListener('click', clearBet);
  if (increaseBetBtn) {
    increaseBetBtn.addEventListener('click', () => {
      setBet(gameState.currentAnte + 10);
    });
  }
  if (decreaseBetBtn) {
    decreaseBetBtn.addEventListener('click', () => {
      setBet(gameState.currentAnte - 10);
    });
  }
  
  // Toggle panel de fichas
  if (toggleChipsBtn) {
    toggleChipsBtn.addEventListener('click', toggleChipsPanel);
  }
  
  // Fichas de casino con sistema de doble clic
  document.querySelectorAll('.casino-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const value = parseInt(chip.dataset.value);
      const currentTime = Date.now();
      
      // Detectar doble clic
      if (currentTime - lastChipClickTime < DOUBLE_CLICK_DELAY && lastChipValue === value) {
        // Doble clic: establecer valor exacto
        setBet(value, false);
        chip.classList.add('selected');
        lastChipClickTime = 0;
        lastChipValue = null;
      } else {
        // Clic simple: acumular
        setBet(value, true);
        lastChipClickTime = currentTime;
        lastChipValue = value;
      }
    });
  });
  
  // Input manual de apuesta
  if (betAmountInput) {
    betAmountInput.addEventListener('input', () => {
      // No validar durante la escritura, permitir borrar todo
    });
    
    betAmountInput.addEventListener('blur', () => {
      let value = parseInt(betAmountInput.value);
      
      if (isNaN(value) || value < gameState.minBet) {
        value = gameState.minBet;
      } else if (value > gameState.maxBet) {
        value = gameState.maxBet;
      }
      
      gameState.currentAnte = value;
      updateCurrentBetDisplay();
    });
  }
  
  // Menú
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  
  // Modales
  if (rulesBtn) rulesBtn.addEventListener('click', openRulesModal);
  if (rulesModalClose) rulesModalClose.addEventListener('click', closeRulesModal);
  if (rulesModalOverlay) rulesModalOverlay.addEventListener('click', closeRulesModal);
  
  if (prizesBtn) prizesBtn.addEventListener('click', openPrizesModal);
  if (prizesModalClose) prizesModalClose.addEventListener('click', closePrizesModal);
  if (prizesModalOverlay) prizesModalOverlay.addEventListener('click', closePrizesModal);
  
  // Toggle payout sidebar
  if (togglePayoutBtn) {
    togglePayoutBtn.addEventListener('click', () => {
      if (payoutSidebar) {
        payoutSidebar.classList.toggle('hidden');
      }
    });
  }
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', initGame);
