// public/js/slots.js - Slots 5x3


const SYMBOL_WEIGHTS = {
  '🍎': 15, 
  '🍊': 15, 
  '🍋': 15, 
  '🍇': 12, 
  '💎': 8,   
  '👑': 6,  
  '🌟': 4, 
  '7️⃣': 2   
};

const SYMBOLS = Object.keys(SYMBOL_WEIGHTS);


const PAYOUTS = {
  '🌟': { 5: 500, 4: 100, 3: 20 },
  '7️⃣': { 5: 1000, 4: 400, 3: 200 }, 
  '👑': { 5: 100, 4: 50, 3: 10 },
  '💎': { 5: 75, 4: 40, 3: 8 },
  '🍇': { 5: 50, 4: 25, 3: 6 },
  '🍎': { 5: 25, 4: 15, 3: 5 },
  '🍊': { 5: 25, 4: 15, 3: 5 },
  '🍋': { 5: 25, 4: 15, 3: 5 },
};

function getWeightedSymbol() {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    random -= weight;
    if (random <= 0) return symbol;
  }
  return SYMBOLS[0];
}

let gameState = {
  balance: 0,
  currentBet: 0,
  lastResults: [],
  isSpinning: false,
  autoSpinMode: false,
  remainingAutoSpins: 0,
};

const spinBtn       = document.getElementById('spinBtn');
const autoBtn       = document.getElementById('autoBtn');
const betInput      = document.getElementById('betInput');
const balanceEl     = document.getElementById('balanceAmount');
const menuBalance   = document.getElementById('menuBalance');
const currentBetEl  = document.getElementById('currentBet');
const winningsEl    = document.getElementById('winnings');

const rulesModal = document.getElementById('rulesModal');
const rulesModalOverlay = document.getElementById('rulesModalOverlay');
const rulesModalClose = document.getElementById('rulesModalClose');
const rulesModalBody = document.getElementById('rulesModalBody');

const prizesModal = document.getElementById('prizesModal');
const prizesModalOverlay = document.getElementById('prizesModalOverlay');
const prizesModalClose = document.getElementById('prizesModalClose');
const prizesModalBody = document.getElementById('prizesModalBody');

const rulesBtn = document.getElementById('rulesBtn');
const prizesBtn = document.getElementById('prizesBtn');

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const settingsModalClose = document.getElementById('settingsModalClose');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const quickChips      = document.querySelectorAll('.chip-btn');
const toast           = document.getElementById('toast');

const resultDisplay       = document.getElementById('resultDisplay');
const resultDisplayTitle  = document.getElementById('resultDisplayTitle');
const resultDisplayAmount = document.getElementById('resultDisplayAmount');
const resultDisplayIcon   = document.getElementById('resultIcon');

const autoSpinBtns    = document.querySelectorAll('.auto-spin-btn:not(.stop-auto)');
const autoSpinCounter = document.getElementById('autoSpinCounter');
const remainingSpinsEl = document.getElementById('remainingSpins');

const columns = {
  column1: document.getElementById('column1'),
  column2: document.getElementById('column2'),
  column3: document.getElementById('column3'),
  column4: document.getElementById('column4'),
  column5: document.getElementById('column5'),
};

document.addEventListener('DOMContentLoaded', () => {
 
  const token = localStorage.getItem('nimetsuCasinoToken');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  loadGameData();
});

async function loadGameData() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    
    if (!token) {
      showToast('Error: No autorizado', 'error');
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }

    const response = await fetch('/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load balance: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && typeof data.balance === 'number') {
      gameState.balance = data.balance;
      updateBalanceDisplay();
    } else {
  
      gameState.balance = 0;
      updateBalanceDisplay();
    }
  } catch (error) {
    showToast('Error al cargar saldo: ' + error.message, 'error');
    gameState.balance = 0;
    updateBalanceDisplay();
  }
}

function updateBalanceDisplay() {
  const n = Number(gameState.balance) || 0;
  const formatted = `$${n.toLocaleString()}`;
  if (balanceEl) {
    balanceEl.textContent = formatted;
  }
  if (menuBalance) {
    menuBalance.textContent = formatted;
  }
}

quickChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const amount = parseInt(chip.dataset.amount, 10) || 0;
    betInput.value = amount;
    gameState.currentBet = amount;
    currentBetEl.textContent = `$${amount.toLocaleString('es-AR')}`;
  });
});

autoBtn.addEventListener('click', () => {
  if (gameState.autoSpinMode) {
   
    stopAutoSpin();
  } else {
    
    startAutoSpin(999);
  }
});

spinBtn.addEventListener('click', performSpin);


autoSpinBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const spins = parseInt(btn.dataset.spins, 10);
    startAutoSpin(spins);
  });
});

function startAutoSpin(spins) {
  if (gameState.isSpinning || gameState.autoSpinMode) return;
  
  const bet = parseInt(betInput.value, 10) || 0;
  
  if (bet < 10) {
    showToast('Apuesta mínima: $10', 'error');
    return;
  }
  
  if (bet > gameState.balance) {
    showToast('Saldo insuficiente', 'error');
    return;
  }
  
  gameState.autoSpinMode = true;
  gameState.remainingAutoSpins = spins;
  
  autoBtn.classList.add('active');
  autoBtn.querySelector('.btn-text').textContent = 'DETENER';
  
  if (spins < 900) {
    autoSpinCounter.classList.add('active');
    updateAutoSpinCounter();
  }
  
  autoSpinBtns.forEach(b => b.classList.remove('active'));
  const activeBtn = Array.from(autoSpinBtns).find(b => parseInt(b.dataset.spins) === spins);
  if (activeBtn) activeBtn.classList.add('active');
  
  performSpin();
}

function stopAutoSpin() {
  gameState.autoSpinMode = false;
  gameState.remainingAutoSpins = 0;
  autoSpinCounter.classList.remove('active');
  autoSpinBtns.forEach(b => b.classList.remove('active'));
  
  autoBtn.classList.remove('active');
  autoBtn.querySelector('.btn-text').textContent = 'AUTO GIRAR';
  
  showToast('Auto-spin detenido', 'info');
}

function updateAutoSpinCounter() {
  if (remainingSpinsEl) {
    remainingSpinsEl.textContent = gameState.remainingAutoSpins;
  }
}

betInput.addEventListener('change', (e) => {
  let value = parseInt(e.target.value, 10) || 0;

  if (value < 10) value = 10;
  if (value > 10000) value = 10000;

  e.target.value = value;
  gameState.currentBet = value;
  currentBetEl.textContent = `$${value.toLocaleString('es-AR')}`;
});

async function performSpin() {
  const bet = parseInt(betInput.value, 10) || 0;

  if (bet < 10) {
    showToast('Apuesta mínima: $10', 'error');
    return;
  }

  if (bet > 10000) {
    showToast('Apuesta máxima: $10,000', 'error');
    return;
  }

  if (bet > Number(gameState.balance)) {
    showToast('Balance insuficiente', 'error');
    return;
  }

  if (gameState.isSpinning) {
    return;
  }

  gameState.isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.add('spinning');
  
  const slotMachine = document.querySelector('.slot-machine, .slots-machine');
  if (slotMachine) {
    slotMachine.classList.add('spinning');
  }
  document.querySelectorAll('.symbol-cell, .reel-cell').forEach(cell => {
    cell.classList.remove('winning', 'landed');
  });
  
  document.querySelectorAll('.symbol, .reel-symbol').forEach(symbol => {
    symbol.removeAttribute('style');
    symbol.classList.remove('highlight');
  });
  
  const winningLine = document.querySelector('.winning-line');
  if (winningLine) {
    winningLine.classList.remove('active');
  }
  
  Object.values(columns).forEach(column => {
    if (column) column.classList.remove('spinning');
  });
  
  void document.body.offsetHeight;

  try {
    const token = localStorage.getItem('nimetsuCasinoToken');

    const res = await fetch('/slots/spin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ betAmount: bet }),
    });

    const result = await res.json();
  

    if (!res.ok || !result.success) {
      const msg = result.message || 'Error en el spin';
      showToast(msg, 'error');
      throw new Error(msg);
    }

    await animateReels(result.result);

    gameState.balance = Number(result.balance) || gameState.balance;
    updateBalanceDisplay();

    if (result.isWin) {
      updateResultDisplay(bet, result.winAmount, true, result.multiplier);
      showResultModal(true, result.winAmount);
      playWinAnimation();
    } else {
      updateResultDisplay(bet, 0, false, 0);
      showResultModal(false, bet);
    }
  } catch (error) {
    console.error('Error en performSpin:', error);
   
  } finally {
    gameState.isSpinning = false;
    spinBtn.disabled = false;
    spinBtn.classList.remove('spinning');
    
    const slotMachine = document.querySelector('.slot-machine, .slots-machine');
    if (slotMachine) {
      slotMachine.classList.remove('spinning');
    }
    
    if (gameState.autoSpinMode && gameState.remainingAutoSpins > 0) {
      gameState.remainingAutoSpins--;
      updateAutoSpinCounter();
      
      if (gameState.remainingAutoSpins > 0) {
       
        setTimeout(() => {
          if (gameState.autoSpinMode) {
            performSpin();
          }
        }, 1500); 
      } else {
        stopAutoSpin();
      }
    }
  }
}

async function animateReels(result) {
  const duration = 2000; 
  const startTime = Date.now();
  let animationFrameId;

  Object.values(columns).forEach(column => {
    if (!column) return;
    
    column.classList.remove('spinning');
    
    column.querySelectorAll('.symbol-cell, .reel-cell').forEach(cell => {
  
      cell.classList.remove('landed', 'winning');
      
      const symbolEl = cell.querySelector('.symbol, .reel-symbol');
      if (symbolEl) {
 
        symbolEl.removeAttribute('style');

        symbolEl.classList.remove('highlight');
      }
    });
  });

  const winningLine = document.querySelector('.winning-line');
  if (winningLine) {
    winningLine.classList.remove('active');
  }

  void document.body.offsetHeight;

  await new Promise(resolve => setTimeout(resolve, 50));
  
  Object.values(columns).forEach(column => {
    if (column) column.classList.add('spinning');
  });

  return new Promise(resolve => {
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
       
        Object.values(columns).forEach(column => {
          if (!column) return;
          const cells = column.querySelectorAll('.symbol-cell, .reel-cell');
          cells.forEach(cell => {
            const symbolEl = cell.querySelector('.symbol, .reel-symbol');
            if (symbolEl) {
              symbolEl.textContent = getWeightedSymbol();
            }
          });
        });

        const speed = 1 - progress;
        animationFrameId = setTimeout(animate, 40 * (1 - speed * 0.85));
      } else {
       
        stopSpinning(result, resolve);
      }
    };
    
    animate();
  });
}

function stopSpinning(result, resolve) {
  if (!result || !result.grid) {
   
    Object.values(columns).forEach(column => {
      if (column) column.classList.remove('spinning');
    });
    resolve();
    return;
  }

  const totalRows = 3;

  const stopRow = (rowIndex) => {
    return new Promise(rowResolve => {
     
      result.grid.forEach((columnData, colIndex) => {
        const colKey = `column${colIndex + 1}`;
        const column = columns[colKey];
        if (!column) return;
        
        const cells = column.querySelectorAll('.symbol-cell, .reel-cell');
        const cell = cells[rowIndex];
        if (!cell) return;
        
        cell.classList.remove('landed', 'winning');
        
        const symbolEl = cell.querySelector('.symbol, .reel-symbol');
        if (symbolEl) {
          symbolEl.textContent = columnData[rowIndex];
          symbolEl.removeAttribute('style');
          symbolEl.classList.remove('highlight');
        }
        
        setTimeout(() => {
          cell.classList.add('landed');
          setTimeout(() => {
            cell.classList.remove('landed');
          }, 380);
        }, colIndex * 30); 
      });

      setTimeout(rowResolve, 420);
    });
  };

  const stopAllRows = async () => {
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
   
      await new Promise(resolve => setTimeout(resolve, 120));
      
      if (rowIndex === totalRows - 1) {
        Object.values(columns).forEach(column => {
          if (column) {
            column.classList.remove('spinning');
          }
        });
        void document.body.offsetHeight;
      }
      
      await stopRow(rowIndex);
    }
    
    await new Promise(resolve => setTimeout(resolve, 80));
    
    if (result.winningCells && result.winningCells.length > 0) {
      const winningLine = document.querySelector('.winning-line');
      if (winningLine) winningLine.classList.add('active');
      
      result.winningCells.forEach(({col, row}) => {
        const colKey = `column${col + 1}`;
        const column = columns[colKey];
        if (!column) return;
        
        const cells = column.querySelectorAll('.symbol-cell, .reel-cell');
        if (cells[row]) {
          cells[row].classList.add('winning');
          const symbolEl = cells[row].querySelector('.symbol, .reel-symbol');
          if (symbolEl) {
            symbolEl.classList.add('highlight');
          }
        }
      });
      
      createWinParticles();
    }
    
    setTimeout(() => {
      Object.values(columns).forEach(column => {
        if (column) column.classList.remove('spinning');
      });
      resolve();
    }, 250);
  };

  stopAllRows();
}

function updateResultDisplay(bet, winnings, isWin, multiplier) {
  currentBetEl.textContent = `$${bet.toLocaleString('es-AR')}`;
  winningsEl.textContent   = `$${winnings.toLocaleString('es-AR')}`;

  const winValueEl = document.querySelector('.win-value');
  if (winValueEl) {
    if (isWin) {
      winValueEl.textContent = `+$${winnings.toLocaleString('es-AR')}`;
      winValueEl.classList.add('winning');
      setTimeout(() => winValueEl.classList.remove('winning'), 1000);
    } else {
      winValueEl.textContent = `$0`;
      winValueEl.classList.remove('winning');
    }
  }

  if (isWin) {
    winningsEl.style.color = '#4CAF50';
  } else {
    winningsEl.style.color = '#E63946';
  }
}

function showResultModal(isWin, amount) {

  resultDisplay.classList.remove('win', 'lose');
  
  if (isWin) {
    resultDisplayIcon.textContent = '✓';
    resultDisplayTitle.textContent = '¡GANASTE!';
    resultDisplayAmount.textContent = `+$${amount.toLocaleString('es-CL')}`;
    resultDisplay.classList.add('win');
  } else {
    resultDisplayIcon.textContent = '✗';
    resultDisplayTitle.textContent = 'PERDISTE';
    resultDisplayAmount.textContent = `-$${amount.toLocaleString('es-CL')}`;
    resultDisplay.classList.add('lose');
  }

  resultDisplay.classList.add('show');
  
}

function closeResultModal() {
  resultDisplay.classList.remove('show');
}

function playWinAnimation() {
  const elements = document.querySelectorAll('.reel-symbol');
  elements.forEach((el, index) => {
    el.style.animation = 'none';
    
    void el.offsetWidth;
    setTimeout(() => {
      el.style.animation = 'pulse 0.5s ease 2';
    }, index * 100);
  });
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  const toastMessage = toast.querySelector('.toast-message') || toast;
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function openMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (sideMenu) sideMenu.classList.add('open');
  if (menuOverlay) menuOverlay.classList.add('active');
}

function closeMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (sideMenu) sideMenu.classList.remove('open');
  if (menuOverlay) menuOverlay.classList.remove('active');
}

function openRulesModal() {
  if (!rulesModal) return;
  
  rulesModalBody.innerHTML = `
    <h3><i class="fas fa-gamepad"></i> Objetivo del Juego</h3>
    <p>Las Tragamonedas (Slots) son un juego de azar donde debes alinear 3 símbolos iguales en los rodillos para ganar premios según el multiplicador de cada combinación.</p>
    
    <h3><i class="fas fa-coins"></i> Cómo Jugar</h3>
    <ol>
        <li><strong>Selecciona tu apuesta:</strong> Usa las fichas rápidas o ingresa un monto entre $10 y $10,000</li>
        <li><strong>Presiona GIRAR:</strong> Los 3 rodillos comenzarán a girar mostrando símbolos aleatorios</li>
        <li><strong>Espera el resultado:</strong> Si alineas 3 símbolos iguales, ¡ganas!</li>
        <li><strong>Cobra tu premio:</strong> El premio se calcula multiplicando tu apuesta por el multiplicador del símbolo</li>
    </ol>
    
    <h3><i class="fas fa-star"></i> Símbolos y Multiplicadores</h3>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Símbolo</th>
                <th>Multiplicador</th>
                <th>Ejemplo (Apuesta $100)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>🌟🌟🌟</td>
                <td>100x</td>
                <td>$10,000</td>
            </tr>
            <tr>
                <td>7️⃣7️⃣7️⃣</td>
                <td>50x</td>
                <td>$5,000</td>
            </tr>
            <tr>
                <td>👑👑👑</td>
                <td>20x</td>
                <td>$2,000</td>
            </tr>
            <tr>
                <td>💎💎💎</td>
                <td>15x</td>
                <td>$1,500</td>
            </tr>
            <tr>
                <td>🍇🍇🍇</td>
                <td>8x</td>
                <td>$800</td>
            </tr>
            <tr>
                <td>🍎🍎🍎</td>
                <td>5x</td>
                <td>$500</td>
            </tr>
            <tr>
                <td>🍊🍊🍊</td>
                <td>5x</td>
                <td>$500</td>
            </tr>
            <tr>
                <td>🍋🍋🍋</td>
                <td>5x</td>
                <td>$500</td>
            </tr>
        </tbody>
    </table>
    
    <div class="highlight-box">
        <h4><i class="fas fa-lightbulb"></i> Consejo</h4>
        <p>Gestiona tu bankroll sabiamente. Las tragamonedas son juegos de azar puro, no hay estrategia que mejore tus probabilidades. Establece límites y diviértete responsablemente.</p>
    </div>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-exclamation-triangle"></i> Importante</h4>
        <p>Debes tener saldo suficiente para cubrir tu apuesta. Los resultados son completamente aleatorios y generados por el servidor.</p>
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

function openPrizesModal() {
  if (!prizesModal) return;
  
  prizesModalBody.innerHTML = `
    <h3><i class="fas fa-trophy"></i> Tabla de Pagos Completa</h3>
    <p>Todos los premios se calculan multiplicando tu apuesta por el multiplicador correspondiente. Se evalúan 5 líneas: superior, media, inferior y 2 diagonales.</p>
    
    <table class="prize-table">
        <thead>
            <tr>
                <th>Combinación</th>
                <th>5 símbolos</th>
                <th>4 símbolos</th>
                <th>3 símbolos</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #000;">
                <td><strong>🌟 Estrella</strong></td>
                <td><strong>500x</strong></td>
                <td>100x</td>
                <td>20x</td>
            </tr>
            <tr style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;">
                <td><strong>7️⃣ JACKPOT</strong> 🎰</td>
                <td><strong>1000x</strong></td>
                <td><strong>400x</strong></td>
                <td><strong>200x</strong></td>
            </tr>
            <tr>
                <td><strong>👑 Corona</strong></td>
                <td>100x</td>
                <td>50x</td>
                <td>10x</td>
            </tr>
            <tr>
                <td><strong>💎 Diamante</strong></td>
                <td>75x</td>
                <td>40x</td>
                <td>8x</td>
            </tr>
            <tr>
                <td><strong>🍇 Uva</strong></td>
                <td>50x</td>
                <td>25x</td>
                <td>6x</td>
            </tr>
            <tr>
                <td><strong>🍎 Manzana</strong></td>
                <td>25x</td>
                <td>15x</td>
                <td>5x</td>
            </tr>
            <tr>
                <td><strong>🍊 Naranja</strong></td>
                <td>25x</td>
                <td>15x</td>
                <td>5x</td>
            </tr>
            <tr>
                <td><strong>🍋 Limón</strong></td>
                <td>25x</td>
                <td>15x</td>
                <td>5x</td>
            </tr>
        </tbody>
    </table>
    
    <h3><i class="fas fa-coins"></i> Ejemplos de Premios JACKPOT 7️⃣</h3>
    <div class="highlight-box" style="border: 3px solid #ef4444; background: rgba(239, 68, 68, 0.1);">
        <h4>🎰 JACKPOT - Triple Siete 7️⃣7️⃣7️⃣</h4>
        <ul>
            <li><strong>Apuesta $100:</strong> $100 × 200 = <strong style="color: #ef4444;">$20,000</strong> 🔥</li>
            <li><strong>Apuesta $500:</strong> $500 × 200 = <strong style="color: #ef4444;">$100,000</strong> 💎</li>
            <li><strong>Apuesta $1,000:</strong> $1,000 × 200 = <strong style="color: #ef4444;">$200,000</strong> 🚀</li>
        </ul>
        <h4>🌟 MEGA JACKPOT - 5 Sietes 7️⃣7️⃣7️⃣7️⃣7️⃣</h4>
        <ul>
            <li><strong>Apuesta $100:</strong> $100 × 1000 = <strong style="color: #ffd700;">$100,000</strong> 🎉💰</li>
            <li><strong>Apuesta $1,000:</strong> $1,000 × 1000 = <strong style="color: #ffd700;">$1,000,000</strong> 🏆👑</li>
        </ul>
    </div>
    
    <h3><i class="fas fa-coins"></i> Otros Ejemplos (Apuesta $100)</h3>
    <div class="highlight-box">
        <ul>
            <li><strong>🌟🌟🌟🌟🌟:</strong> $100 × 500 = <strong>$50,000</strong> 💫</li>
            <li><strong>👑👑👑👑👑:</strong> $100 × 100 = <strong>$10,000</strong></li>
            <li><strong>💎💎💎:</strong> $100 × 8 = <strong>$800</strong></li>
            <li><strong>🍇🍇🍇:</strong> $100 × 6 = <strong>$600</strong></li>
        </ul>
    </div>
    
    <h3><i class="fas fa-percentage"></i> Información del Juego</h3>
    <ul>
        <li><strong>Líneas de Pago:</strong> 5 (superior, media, inferior, diagonal ↘️, diagonal ↗️)</li>
        <li><strong>Símbolo Especial:</strong> 7️⃣ JACKPOT (muy raro, pagos masivos)</li>
        <li><strong>Apuesta Mínima:</strong> $10</li>
        <li><strong>Apuesta Máxima:</strong> $10,000</li>
        <li><strong>Premio Máximo:</strong> 1000x (7️⃣ × 5)</li>
    </ul>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-chart-line"></i> Probabilidades</h4>
        <p>Los símbolos tienen diferentes probabilidades de aparecer:</p>
        <ul>
            <li>🍎🍊🍋: Muy comunes (15% cada uno)</li>
            <li>🍇: Común (12%)</li>
            <li>💎: Poco común (8%)</li>
            <li>👑: Raro (6%)</li>
            <li>🌟: Muy raro (4%)</li>
            <li>7️⃣: <strong>EXTREMADAMENTE RARO (2%)</strong> - JACKPOT 🎰</li>
        </ul>
        <p>Los resultados son completamente aleatorios y cada giro es independiente.</p>
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

function openSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.add('show');
}

function closeSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.remove('show');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      showToast('Error al activar pantalla completa', 'error');
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function createWinParticles() {
  const machineScreen = document.querySelector('.machine-screen');
  if (!machineScreen) return;
  
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'win-particle';
   
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const endX = startX + (Math.random() - 0.5) * 50;
    const endY = startY - Math.random() * 100;
    const duration = Math.random() * 2 + 1;
    
    particle.style.cssText = `
      position: absolute;
      left: ${startX}%;
      top: ${startY}%;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: radial-gradient(circle, #fbbf24, #f59e0b);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 0 10px #fbbf24;
      opacity: 1;
      transition: all ${duration}s ease-out;
    `;
    
    machineScreen.appendChild(particle);
    
    requestAnimationFrame(() => {
      particle.animate([
        {
          opacity: 1,
          transform: 'translate(0, 0) scale(1)'
        },
        {
          opacity: 0,
          transform: `translate(${endX - startX}%, ${endY - startY}%) scale(0)`
        }
      ], {
        duration: duration * 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });
    });
    
    setTimeout(() => {
      particle.remove();
    }, duration * 1000 + 100);
  }
}

function setupMenuListeners() {
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  
  const logoutLinks = document.querySelectorAll('a[href="/logout"]');
  logoutLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  });
  
  if (rulesBtn) rulesBtn.addEventListener('click', openRulesModal);
  if (rulesModalClose) rulesModalClose.addEventListener('click', closeRulesModal);
  if (rulesModalOverlay) rulesModalOverlay.addEventListener('click', closeRulesModal);
  
  if (prizesBtn) prizesBtn.addEventListener('click', openPrizesModal);
  if (prizesModalClose) prizesModalClose.addEventListener('click', closePrizesModal);
  if (prizesModalOverlay) prizesModalOverlay.addEventListener('click', closePrizesModal);
  
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
  if (settingsModalClose) settingsModalClose.addEventListener('click', closeSettingsModal);
  if (settingsModalOverlay) settingsModalOverlay.addEventListener('click', closeSettingsModal);
  if (fullscreenToggle) fullscreenToggle.addEventListener('click', toggleFullscreen);
  
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

}

const exitBtn = document.querySelector('.exit-btn');
if (exitBtn) {
  exitBtn.addEventListener('click', () => {
    window.location.href = '/dashboard';
  });
}

async function handleLogout() {
  try {
    await fetch('/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {}
  
  localStorage.removeItem('nimetsuCasinoToken');
  localStorage.removeItem('nimetsuCasinoUser');
  localStorage.removeItem('nimetsuCasinoBalance');
  
  document.cookie = 'nimetsuCasinoToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  window.location.href = '/login';
}

setupMenuListeners();
