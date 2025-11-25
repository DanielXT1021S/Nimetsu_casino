
let rouletteState = {
  userBalance: 0,
  currentBet: 100,
  bets: [],
  wheelInfo: null,
  isSpinning: false,
  lastResults: [],
  minBet: 10,
  maxBet: 10000
};

let lastChipClickTime = 0;
let lastChipValue = null;
const DOUBLE_CLICK_DELAY = 400;

let chipsExpanded = false;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});

async function initGame() {
  try {
    await loadUserBalance();
    setupMenuListeners();
    generateWheelNumbers();
    setupGameListeners();
    setupChipsListeners();
    addBetButtonListeners();
  } catch (error) {
    showToast('Error al cargar el juego', 'error');
  }
}

async function loadUserBalance() {
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
      rouletteState.userBalance = data.balance;
    } else {
      rouletteState.userBalance = 0;
    }
    updateBalanceDisplay();
  } catch (error) {
    showToast('Error al cargar saldo: ' + error.message, 'error');
    rouletteState.userBalance = 0;
    updateBalanceDisplay();
  }
}

function setupMenuListeners() {
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  const sideMenu = document.getElementById('sideMenu');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const togglePayoutBtn = document.getElementById('togglePayoutBtn');
  const payoutSidebar = document.getElementById('payoutSidebar');
  
  const rulesBtn = document.getElementById('rulesBtn');
  const prizesBtn = document.getElementById('prizesBtn');
  
  const rulesModal = document.getElementById('rulesModal');
  const rulesModalOverlay = document.getElementById('rulesModalOverlay');
  const rulesModalClose = document.getElementById('rulesModalClose');
  
  const prizesModal = document.getElementById('prizesModal');
  const prizesModalOverlay = document.getElementById('prizesModalOverlay');
  const prizesModalClose = document.getElementById('prizesModalClose');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (sideMenu) sideMenu.classList.add('open');
      if (menuOverlay) menuOverlay.classList.add('active');
    });
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMenu);
  }
  
  const logoutLinks = document.querySelectorAll('a[href="/logout"]');
  logoutLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  });
  
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }
  
  if (rulesBtn) {
    rulesBtn.addEventListener('click', openRulesModal);
  }
  
  if (rulesModalClose) {
    rulesModalClose.addEventListener('click', closeRulesModal);
  }
  
  if (rulesModalOverlay) {
    rulesModalOverlay.addEventListener('click', closeRulesModal);
  }
  
  if (prizesBtn) {
    prizesBtn.addEventListener('click', openPrizesModal);
  }
  
  if (prizesModalClose) {
    prizesModalClose.addEventListener('click', closePrizesModal);
  }
  
  if (prizesModalOverlay) {
    prizesModalOverlay.addEventListener('click', closePrizesModal);
  }

  if (togglePayoutBtn) {
    togglePayoutBtn.addEventListener('click', () => {
      if (payoutSidebar) {
        payoutSidebar.classList.toggle('hidden');
      }
    });
  }
}

function closeMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  if (sideMenu) sideMenu.classList.remove('open');
  if (menuOverlay) menuOverlay.classList.remove('active');
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

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function openRulesModal() {
  const rulesModal = document.getElementById('rulesModal');
  const rulesModalBody = document.getElementById('rulesModalBody');
  
  if (!rulesModal || !rulesModalBody) return;
  
  rulesModalBody.innerHTML = `
    <h3><i class="fas fa-gamepad"></i> Objetivo del Juego</h3>
    <p>La ruleta es un juego de azar donde debes predecir en qué número o combinación caerá la bola después de girar la rueda. Puedes apostar a números individuales, colores, rangos y más.</p>
    
    <h3><i class="fas fa-circle"></i> La Rueda Europea</h3>
    <p>Nuestra ruleta utiliza el formato europeo con <strong>37 números</strong> (0-36):</p>
    <ul>
        <li><strong>0 (Verde):</strong> Casilla especial de la casa</li>
        <li><strong>18 Números Rojos:</strong> 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36</li>
        <li><strong>18 Números Negros:</strong> 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35</li>
    </ul>
    
    <h3><i class="fas fa-coins"></i> Tipos de Apuesta</h3>
    
    <h4>Apuestas Internas (Inside Bets):</h4>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Ejemplo</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Pleno</strong></td>
                <td>Un solo número (incluye 0)</td>
                <td>17</td>
            </tr>
            <tr>
                <td><strong>Semipleno</strong></td>
                <td>Dos números adyacentes</td>
                <td>5-6</td>
            </tr>
            <tr>
                <td><strong>Calle</strong></td>
                <td>Tres números en fila</td>
                <td>1-2-3</td>
            </tr>
            <tr>
                <td><strong>Cuadro</strong></td>
                <td>Cuatro números en esquina</td>
                <td>8-9-11-12</td>
            </tr>
            <tr>
                <td><strong>Línea</strong></td>
                <td>Seis números (dos filas)</td>
                <td>1-2-3-4-5-6</td>
            </tr>
        </tbody>
    </table>
    
    <h4>Apuestas Externas (Outside Bets):</h4>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Números</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Rojo/Negro</strong></td>
                <td>Color de la casilla</td>
                <td>18 números cada uno</td>
            </tr>
            <tr>
                <td><strong>Par/Impar</strong></td>
                <td>Números pares o impares</td>
                <td>18 números cada uno</td>
            </tr>
            <tr>
                <td><strong>1-18 / 19-36</strong></td>
                <td>Mitad baja o alta</td>
                <td>18 números cada uno</td>
            </tr>
            <tr>
                <td><strong>Docenas</strong></td>
                <td>1-12, 13-24, 25-36</td>
                <td>12 números cada una</td>
            </tr>
            <tr>
                <td><strong>Columnas</strong></td>
                <td>Columnas verticales 2:1</td>
                <td>12 números cada una</td>
            </tr>
        </tbody>
    </table>
    
    <h3><i class="fas fa-play-circle"></i> Cómo Jugar</h3>
    <ol>
        <li><strong>Selecciona tu ficha:</strong> Haz doble clic en una ficha para establecer ese valor, o clic simple para acumular</li>
        <li><strong>Coloca tus apuestas:</strong> Haz clic en los números o áreas del tablero</li>
        <li><strong>Revisa tus apuestas:</strong> Verás el resumen en "Mis Apuestas"</li>
        <li><strong>Gira la ruleta:</strong> Presiona "GIRAR" cuando estés listo</li>
        <li><strong>Observa el resultado:</strong> La bola caerá en un número y verás tus ganancias</li>
    </ol>
    
    <div class="highlight-box">
        <h4><i class="fas fa-lightbulb"></i> Consejos Estratégicos</h4>
        <ul>
            <li>Puedes hacer múltiples apuestas en un solo giro</li>
            <li>Las apuestas internas tienen mayor pago pero menor probabilidad</li>
            <li>Las apuestas externas son más seguras pero pagan menos</li>
            <li>El 0 verde es la ventaja de la casa (si sale 0, las apuestas externas pierden)</li>
        </ul>
    </div>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-exclamation-triangle"></i> Importante</h4>
        <p>Apuesta mínima: $10 | Apuesta máxima: $10,000 por giro</p>
    </div>
  `;
  
  rulesModal.classList.add('show');
  closeMenu();
}

function closeRulesModal() {
  const rulesModal = document.getElementById('rulesModal');
  if (rulesModal) {
    rulesModal.classList.remove('show');
  }
}

function openPrizesModal() {
  const prizesModal = document.getElementById('prizesModal');
  const prizesModalBody = document.getElementById('prizesModalBody');
  
  if (!prizesModal || !prizesModalBody) return;
  
  prizesModalBody.innerHTML = `
    <h3><i class="fas fa-trophy"></i> Tabla de Pagos</h3>
    <p>Los pagos en la ruleta europea se calculan según el tipo de apuesta que realices:</p>
    
    <h4>Apuestas Internas (Inside Bets)</h4>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Tipo de Apuesta</th>
                <th>Números Cubiertos</th>
                <th>Pago</th>
                <th>Probabilidad</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><i class="fas fa-bullseye" style="color: gold;"></i> <strong>Pleno</strong></td>
                <td>1 número</td>
                <td><strong>35:1</strong></td>
                <td>2.70%</td>
            </tr>
            <tr>
                <td><i class="fas fa-grip-lines-vertical" style="color: #9333ea;"></i> <strong>Semipleno</strong></td>
                <td>2 números</td>
                <td><strong>17:1</strong></td>
                <td>5.41%</td>
            </tr>
            <tr>
                <td><i class="fas fa-minus" style="color: #06b6d4;"></i> <strong>Calle</strong></td>
                <td>3 números</td>
                <td><strong>11:1</strong></td>
                <td>8.11%</td>
            </tr>
            <tr>
                <td><i class="fas fa-square" style="color: #10b981;"></i> <strong>Cuadro</strong></td>
                <td>4 números</td>
                <td><strong>8:1</strong></td>
                <td>10.81%</td>
            </tr>
            <tr>
                <td><i class="fas fa-equals" style="color: #f59e0b;"></i> <strong>Línea</strong></td>
                <td>6 números</td>
                <td><strong>5:1</strong></td>
                <td>16.22%</td>
            </tr>
        </tbody>
    </table>
    
    <h4>Apuestas Externas (Outside Bets)</h4>
    <table class="prize-table">
        <thead>
            <tr>
                <th>Tipo de Apuesta</th>
                <th>Números Cubiertos</th>
                <th>Pago</th>
                <th>Probabilidad</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><i class="fas fa-layer-group" style="color: #ef4444;"></i> <strong>Columna</strong></td>
                <td>12 números</td>
                <td><strong>2:1</strong></td>
                <td>32.43%</td>
            </tr>
            <tr>
                <td><i class="fas fa-th-large" style="color: #8b5cf6;"></i> <strong>Docena</strong></td>
                <td>12 números</td>
                <td><strong>2:1</strong></td>
                <td>32.43%</td>
            </tr>
            <tr>
                <td><i class="fas fa-palette" style="color: #ec4899;"></i> <strong>Rojo/Negro</strong></td>
                <td>18 números</td>
                <td><strong>1:1</strong></td>
                <td>48.65%</td>
            </tr>
            <tr>
                <td><i class="fas fa-divide" style="color: #14b8a6;"></i> <strong>Par/Impar</strong></td>
                <td>18 números</td>
                <td><strong>1:1</strong></td>
                <td>48.65%</td>
            </tr>
            <tr>
                <td><i class="fas fa-arrows-alt-h" style="color: #f97316;"></i> <strong>1-18 / 19-36</strong></td>
                <td>18 números</td>
                <td><strong>1:1</strong></td>
                <td>48.65%</td>
            </tr>
        </tbody>
    </table>
    
    <h3><i class="fas fa-coins"></i> Ejemplos de Pago</h3>
    <div class="highlight-box">
        <h4>Apuesta: $100</h4>
        <ul>
            <li><strong>Pleno (número individual):</strong> Ganas <strong>$3,500</strong> + recuperas $100 = <strong>$3,600 total</strong></li>
            <li><strong>Semipleno (2 números):</strong> Ganas <strong>$1,700</strong> + recuperas $100 = <strong>$1,800 total</strong></li>
            <li><strong>Columna/Docena:</strong> Ganas <strong>$200</strong> + recuperas $100 = <strong>$300 total</strong></li>
            <li><strong>Rojo/Negro/Par/Impar:</strong> Ganas <strong>$100</strong> + recuperas $100 = <strong>$200 total</strong></li>
        </ul>
    </div>
    
    <h3><i class="fas fa-percentage"></i> Ventaja de la Casa</h3>
    <ul>
        <li><strong>RTP (Return to Player):</strong> 97.30%</li>
        <li><strong>Ventaja de la Casa:</strong> 2.70%</li>
        <li>La ruleta europea es más favorable que la americana (que tiene doble cero)</li>
        <li>El 0 verde es lo que da ventaja a la casa</li>
    </ul>
    
    <h3><i class="fas fa-star"></i> Apuestas Especiales</h3>
    <div class="highlight-box">
        <h4>Vecinos y Apuestas Anunciadas</h4>
        <p>En casinos físicos existen apuestas especiales como:</p>
        <ul>
            <li><strong>Vecinos del Cero:</strong> 17 números alrededor del 0</li>
            <li><strong>Tercio del Cilindro:</strong> 12 números opuestos al 0</li>
            <li><strong>Huérfanos:</strong> 8 números no cubiertos por las anteriores</li>
        </ul>
        <p><em>Próximamente disponibles en nuestra ruleta...</em></p>
    </div>
    
    <div class="highlight-box warning">
        <h4><i class="fas fa-chart-line"></i> Probabilidades Clave</h4>
        <ul>
            <li>Cada número tiene exactamente 1/37 de probabilidad (2.70%)</li>
            <li>No hay "números calientes" - cada giro es independiente</li>
            <li>Las apuestas combinadas suman las probabilidades de los números cubiertos</li>
            <li>El resultado anterior NO afecta el próximo giro</li>
        </ul>
    </div>
  `;
  
  prizesModal.classList.add('show');
  closeMenu();
}

function closePrizesModal() {
  const prizesModal = document.getElementById('prizesModal');
  if (prizesModal) {
    prizesModal.classList.remove('show');
  }
}

function setupGameListeners() {
  const spinBtn = document.getElementById('spinBtn');
  const clearBetsBtn = document.getElementById('clearBetsBtn');
  const resetBtn = document.getElementById('resetBtn');

  if (spinBtn) spinBtn.addEventListener('click', spinWheel);
  if (clearBetsBtn) clearBetsBtn.addEventListener('click', clearAllBets);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);
}

function setupChipsListeners() {
  const toggleChipsBtn = document.getElementById('toggleChipsBtn');
  const chipsSection = document.getElementById('chipsSection');
  const betDisplayGroup = document.querySelector('.bet-display-group');
  const compactBetDisplay = document.querySelector('.compact-bet-display');
  const casinoChips = document.querySelectorAll('.casino-chip');
  const betAmountInput = document.getElementById('betAmountInput');
  const increaseBetBtn = document.getElementById('increaseBetBtn');
  const decreaseBetBtn = document.getElementById('decreaseBetBtn');
  const clearBtn = document.getElementById('clearBtn');

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

  
  if (toggleChipsBtn) {
    toggleChipsBtn.addEventListener('click', toggleChips);
  }

  casinoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const value = parseInt(chip.dataset.value);
      const currentTime = Date.now();
    
      if (lastChipValue === value && (currentTime - lastChipClickTime) < DOUBLE_CLICK_DELAY) {
    
        setBet(value, false);
        lastChipClickTime = 0;
        lastChipValue = null;
      } else {
      
        setBet(value, true);
        lastChipClickTime = currentTime;
        lastChipValue = value;
      }
    });
  });

  if (increaseBetBtn) {
    increaseBetBtn.addEventListener('click', () => {
      setBet(rouletteState.currentBet + 10);
    });
  }

  if (decreaseBetBtn) {
    decreaseBetBtn.addEventListener('click', () => {
      setBet(rouletteState.currentBet - 10);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      rouletteState.currentBet = 10;
      updateCurrentBetDisplay();
      showToast('Apuesta restablecida a $10', 'info');
    });
  }

  if (betAmountInput) {
    betAmountInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value === '' || value === '0') {
        return;
      }
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        rouletteState.currentBet = numValue;
      }
    });
    
    betAmountInput.addEventListener('blur', (e) => {
      const value = parseInt(e.target.value);
      if (isNaN(value) || value < rouletteState.minBet) {
        setBet(rouletteState.minBet);
      } else {
        setBet(value);
      }
    });
    
    betAmountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        betAmountInput.blur();
      }
    });
  }
}

function setBet(amount, accumulate = false) {
  let newBet;
  
  if (accumulate) {
    newBet = rouletteState.currentBet + parseInt(amount);
  } else {
    newBet = parseInt(amount);
  }
  
  if (isNaN(newBet) || newBet < rouletteState.minBet) {
    rouletteState.currentBet = rouletteState.minBet;
    showToast(`Apuesta mínima: $${rouletteState.minBet}`, 'warning');
  } else if (newBet > rouletteState.maxBet) {
    rouletteState.currentBet = rouletteState.maxBet;
    showToast(`Apuesta máxima: $${rouletteState.maxBet}`, 'warning');
  } else if (newBet > rouletteState.userBalance) {
    rouletteState.currentBet = Math.min(rouletteState.userBalance, rouletteState.maxBet);
    showToast('Saldo insuficiente', 'error');
  } else {
    rouletteState.currentBet = newBet;
  }
  
  updateCurrentBetDisplay();
  
  document.querySelectorAll('.casino-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
}

function updateCurrentBetDisplay() {
  const betAmountInput = document.getElementById('betAmountInput');
  const compactBetAmount = document.getElementById('compactBetAmount');
  
  if (betAmountInput) {
    betAmountInput.value = rouletteState.currentBet;
  }
  if (compactBetAmount) {
    compactBetAmount.textContent = `$${rouletteState.currentBet.toLocaleString()}`;
  }
}

function toggleChips() {
  chipsExpanded = !chipsExpanded;
  
  const chipsSection = document.getElementById('chipsSection');
  const toggleChipsBtn = document.getElementById('toggleChipsBtn');
  const betDisplayGroup = document.querySelector('.bet-display-group');
  const compactBetDisplay = document.querySelector('.compact-bet-display');
  const compactHeader = document.querySelector('.compact-bet-header');
  
  if (chipsExpanded) {
    if (chipsSection) chipsSection.classList.remove('collapsed');
    if (toggleChipsBtn) toggleChipsBtn.classList.remove('collapsed');
    if (betDisplayGroup) betDisplayGroup.classList.remove('collapsed');
    if (compactBetDisplay) compactBetDisplay.classList.remove('show');
    if (compactHeader) compactHeader.classList.add('expanded');
  } else {
    if (chipsSection) chipsSection.classList.add('collapsed');
    if (toggleChipsBtn) toggleChipsBtn.classList.add('collapsed');
    if (betDisplayGroup) betDisplayGroup.classList.add('collapsed');
    if (compactBetDisplay) compactBetDisplay.classList.add('show');
    if (compactHeader) compactHeader.classList.remove('expanded');
  }
}
function addBetButtonListeners() {
  const numberBtns = document.querySelectorAll('[data-bet-type="straight"]');
  const redBtn = document.querySelector('[data-bet-type="red"]');
  const blackBtn = document.querySelector('[data-bet-type="black"]');
  const oddBtn = document.querySelector('[data-bet-type="odd"]');
  const evenBtn = document.querySelector('[data-bet-type="even"]');
  const lowBtn = document.querySelector('[data-bet-type="low"]');
  const highBtn = document.querySelector('[data-bet-type="high"]');
  const dozenBtns = document.querySelectorAll('[data-bet-type^="dozen"]');
  const columnBtns = document.querySelectorAll('[data-bet-type^="column"]');

  numberBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const betValue = parseInt(btn.dataset.betValue);
      const label = `Número ${betValue}`;
      placeBet('straight', betValue, label);
    });
  });

  if (redBtn) redBtn.addEventListener('click', () => placeBet('red', null, 'Rojo'));
  if (blackBtn) blackBtn.addEventListener('click', () => placeBet('black', null, 'Negro'));
  if (oddBtn) oddBtn.addEventListener('click', () => placeBet('odd', null, 'Impar'));
  if (evenBtn) evenBtn.addEventListener('click', () => placeBet('even', null, 'Par'));
  if (lowBtn) lowBtn.addEventListener('click', () => placeBet('low', null, '1-18'));
  if (highBtn) highBtn.addEventListener('click', () => placeBet('high', null, '19-36'));

  dozenBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const betType = btn.dataset.betType;
      const label = btn.textContent.trim();
      placeBet(betType, null, label);
    });
  });

  columnBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const betType = btn.dataset.betType;
      const label = btn.textContent.trim();
      placeBet(betType, null, label);
    });
  });
}

function setupGameListeners() {
  const spinBtn = document.getElementById('spinBtn');
  const clearBetsBtn = document.getElementById('clearBetsBtn');
  const resetBtn = document.getElementById('resetBtn');

  if (spinBtn) spinBtn.addEventListener('click', spinWheel);
  if (clearBetsBtn) clearBetsBtn.addEventListener('click', clearAllBets);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);
}

const svgNS = "http://www.w3.org/2000/svg";
let pocketData = [];

const wheelNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
  6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26
];

const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

function getColorHex(num) {
  if (num === 0) return "#0c7c3a";
  return redNumbers.has(num) ? "#c3131a" : "#222222";
}

function getColorName(num) {
  if (num === 0) return "VERDE";
  return redNumbers.has(num) ? "ROJO" : "NEGRO";
}

function generateWheelNumbers() {
  const pocketsGroup = document.getElementById('pocketsGroup');
  if (!pocketsGroup) {
    console.error('pocketsGroup not found');
    return;
  }

  const totalPockets = wheelNumbers.length;
  const stepAngleRad = (2 * Math.PI) / totalPockets;
  const centerX = 200;
  const centerY = 200;

  const rOuter = 170; 
  const rInner = 125;  
  const rLabel = 147;  

  pocketData = []; 

  for (let i = 0; i < totalPockets; i++) {
    const num = wheelNumbers[i];

    const startAngle = -Math.PI / 2 - stepAngleRad / 2 + i * stepAngleRad;
    const endAngle = startAngle + stepAngleRad;
    const middleAngle = (startAngle + endAngle) / 2;

    const x1o = centerX + rOuter * Math.cos(startAngle);
    const y1o = centerY + rOuter * Math.sin(startAngle);
    const x2o = centerX + rOuter * Math.cos(endAngle);
    const y2o = centerY + rOuter * Math.sin(endAngle);

    const x2i = centerX + rInner * Math.cos(endAngle);
    const y2i = centerY + rInner * Math.sin(endAngle);
    const x1i = centerX + rInner * Math.cos(startAngle);
    const y1i = centerY + rInner * Math.sin(startAngle);

    const largeArcFlag = 0;
    const outerSweep = 1;
    const innerSweep = 0;

    const d = [
      "M", x1i, y1i,
      "L", x1o, y1o,
      "A", rOuter, rOuter, 0, largeArcFlag, outerSweep, x2o, y2o,
      "L", x2i, y2i,
      "A", rInner, rInner, 0, largeArcFlag, innerSweep, x1i, y1i,
      "Z"
    ].join(" ");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", getColorHex(num));
    path.classList.add("pocket-path");
    path.dataset.number = num;
    pocketsGroup.appendChild(path);

    const tx = centerX + rLabel * Math.cos(middleAngle);
    const ty = centerY + rLabel * Math.sin(middleAngle) + 3;

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", tx);
    text.setAttribute("y", ty);
    text.textContent = num;
    text.classList.add("pocket-label");
    text.dataset.number = num;
    pocketsGroup.appendChild(text);

    pocketData.push({ path, middleAngle, num });
  }
}

function placeBet(betType, betValue, betLabel) {
  const amount = rouletteState.currentBet;

  if (amount <= 0) {
    showToast('Ingresa una cantidad válida', 'error');
    return;
  }

  if (amount > rouletteState.userBalance) {
    showToast('Saldo insuficiente', 'error');
    return;
  }

  const bet = {
    id: Date.now() + Math.random(),
    type: betType,
    value: betValue,
    amount: amount,
    label: betLabel || getBetLabel(betType, betValue),
    payout: getPayoutMultiplier(betType)
  };

  rouletteState.bets.push(bet);
  
  showChipOnBoard(betType, betValue, amount);
  
  updateBetsSummary();
  updateTotalBet();

  showToast(`✓ ${bet.label} - $${amount}`, 'success');
}

function getBetLabel(betType, betValue) {
  const labels = {
    'straight': `Número ${betValue}`,
    'red': 'Rojo',
    'black': 'Negro',
    'odd': 'Impar',
    'even': 'Par',
    'low': '1-18',
    'high': '19-36',
    'dozen_1st': '1er Docena',
    'dozen_2nd': '2do Docena',
    'dozen_3rd': '3er Docena',
    'column_1st': 'Columna 1',
    'column_2nd': 'Columna 2',
    'column_3rd': 'Columna 3'
  };
  return labels[betType] || betType;
}

function getPayoutMultiplier(betType) {
  const multipliers = {
    'straight': 36,
    'dozen_1st': 2, 'dozen_2nd': 2, 'dozen_3rd': 2,
    'column_1st': 2, 'column_2nd': 2, 'column_3rd': 2,
    'red': 1, 'black': 1, 'odd': 1, 'even': 1, 'low': 1, 'high': 1
  };
  return multipliers[betType] || 0;
}

function updateBetsSummary() {
  const summary = document.getElementById('betsSummary');
  if (!summary) return;

  summary.innerHTML = '';

  if (rouletteState.bets.length === 0) {
    summary.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; font-style: italic; padding: 1rem;">Coloca fichas en el tablero para apostar</p>';
    return;
  }

  const groupedBets = {};
  rouletteState.bets.forEach(bet => {
    const key = `${bet.type}-${bet.value}`;
    if (!groupedBets[key]) {
      groupedBets[key] = {
        label: bet.label,
        total: 0,
        count: 0,
        bets: []
      };
    }
    groupedBets[key].total += bet.amount;
    groupedBets[key].count++;
    groupedBets[key].bets.push(bet);
  });

  Object.values(groupedBets).forEach(group => {
    const div = document.createElement('div');
    div.className = 'bet-item';
    div.innerHTML = `
      <div class="bet-item-info">
        <span class="bet-item-type">${group.label}${group.count > 1 ? ` (x${group.count})` : ''}</span>
        <span class="bet-item-amount">$${group.total}</span>
      </div>
      <button class="bet-item-remove" data-bets="${group.bets.map(b => b.id).join(',')}">✕</button>
    `;

    const removeBtn = div.querySelector('.bet-item-remove');
    removeBtn.addEventListener('click', () => {
      const ids = removeBtn.dataset.bets.split(',');
      ids.forEach(id => removeBet(parseFloat(id)));
    });

    summary.appendChild(div);
  });
}

function removeBet(betId) {
  rouletteState.bets = rouletteState.bets.filter(b => b.id !== betId);
  updateBetsSummary();
  updateTotalBet();
  
  clearChipsFromBoard();
  rouletteState.bets.forEach(bet => {
    showChipOnBoard(bet.type, bet.value, bet.amount);
  });
}

function clearAllBets() {
  rouletteState.bets = [];
  updateBetsSummary();
  updateTotalBet();
  clearChipsFromBoard();
  showToast('Apuestas limpias', 'success');
}

function updateTotalBet() {
  const totalBetEl = document.getElementById('totalBet');
  const total = rouletteState.bets.reduce((sum, bet) => sum + bet.amount, 0);
  if (totalBetEl) {
    totalBetEl.textContent = `$${total.toLocaleString()}`;
  }
}

function showChipOnBoard(betType, betValue, amount) {
 
  let cell = null;
  
  if (betType === 'straight') {
    cell = document.querySelector(`.bet-cell[data-bet-type="straight"][data-bet-value="${betValue}"]`);
  } else {
    cell = document.querySelector(`.bet-cell[data-bet-type="${betType}"]`);
    if (!cell && betValue !== undefined) {
      cell = document.querySelector(`.bet-cell[data-bet-type="${betType}"][data-bet-value="${betValue}"]`);
    }
  }
  
  if (!cell) {
    console.warn(`No se encontró celda para ${betType} - ${betValue}`);
    return;
  }
  
  let chipStack = cell.querySelector('.bet-chip-stack');
  
  if (!chipStack) {
    chipStack = document.createElement('div');
    chipStack.className = 'bet-chip-stack';
    cell.appendChild(chipStack);
  }
  
  const cellBets = rouletteState.bets.filter(bet => 
    (bet.type === betType) && 
    (betValue === undefined || bet.value === betValue)
  );
  
  const totalAmount = cellBets.reduce((sum, bet) => sum + bet.amount, 0);
  
  chipStack.innerHTML = '';
  
  
  const chipColorValue = getChipColorValue(amount);
  
  const chip = document.createElement('div');
  chip.className = 'bet-chip-visual';
  chip.setAttribute('data-chip-value', chipColorValue);
  chip.textContent = formatChipAmount(amount);
  chipStack.appendChild(chip);

  if (cellBets.length > 1) {
    const totalBadge = document.createElement('div');
    totalBadge.className = 'bet-chip-total';
    totalBadge.textContent = formatChipAmount(totalAmount);
    chipStack.appendChild(totalBadge);
  }
}

function getChipColorValue(amount) {
  if (amount >= 1000) return 1000;
  if (amount >= 500) return 500;
  if (amount >= 100) return 100;
  if (amount >= 50) return 50;
  if (amount >= 25) return 25;
  return 10;
}

function formatChipAmount(amount) {
  
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return `$${amount}`;
}

function clearChipsFromBoard() {
  document.querySelectorAll('.bet-chip-stack').forEach(stack => stack.remove());
}


function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function clearHighlights() {
  pocketData.forEach(p => p.path.classList.remove("win"));
}

async function spinWheel() {
  if (rouletteState.bets.length === 0) {
    showToast('Debes tener al menos una apuesta', 'error');
    return;
  }

  if (rouletteState.isSpinning) {
    showToast('La ruleta ya está girando', 'warning');
    return;
  }

  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) {
      showToast('Error: No autorizado', 'error');
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }
    
    const totalBet = rouletteState.bets.reduce((sum, bet) => sum + bet.amount, 0);

    if (totalBet > rouletteState.userBalance) {
      showToast('Saldo insuficiente para estas apuestas', 'error');
      return;
    }

    const spinBtn = document.getElementById('spinBtn');
    rouletteState.isSpinning = true;
    if (spinBtn) spinBtn.disabled = true;

    clearHighlights();

    const response = await fetch('/api/roulette/spin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bets: rouletteState.bets
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error del servidor: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Respuesta inválida del servidor');
    }

    const data = await response.json();

    if (!data.success) {
      showToast(data.message || 'Error al girar la ruleta', 'error');
      rouletteState.isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      return;
    }

    await animateSVGSpin(data.wheelNumber);

    highlightWinningNumber(data.wheelNumber);

    setTimeout(() => {
      displayResult(data);
    }, 500);

    rouletteState.userBalance = data.newBalance;
    updateBalanceDisplay();

    rouletteState.lastResults.unshift(data.wheelNumber);
    if (rouletteState.lastResults.length > 10) {
      rouletteState.lastResults.pop();
    }
    updateLastResults();

    setTimeout(() => {
      rouletteState.bets = [];
      updateBetsSummary();
      updateTotalBet();
      clearChipsFromBoard();
      clearHighlights();
    }, 3000);

    rouletteState.isSpinning = false;
    if (spinBtn) spinBtn.disabled = false;

  } catch (error) {
    console.error('Error spinning wheel:', error);
    
    let errorMessage = 'Error desconocido';
    let errorType = 'error';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Sin conexión al servidor. Verifica tu internet.';
      errorType = 'error';
    } else if (error.message.includes('Tu saldo no fue afectado')) {
      errorMessage = 'Error al procesar el giro. Tu saldo NO fue afectado y será actualizado.';
      errorType = 'warning';
    } else if (error.message.includes('Saldo insuficiente')) {
      errorMessage = 'Saldo insuficiente para completar las apuestas.';
      errorType = 'error';
    } else if (error.message.includes('servidor')) {
      errorMessage = error.message;
      errorType = 'error';
    } else if (error.message.includes('token') || error.message.includes('Sesión')) {
      errorMessage = 'Sesión expirada. Redirigiendo a login...';
      errorType = 'warning';
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (error.message.includes('Respuesta inválida')) {
      errorMessage = 'Error interno. Tu saldo será verificado desde el servidor.';
      errorType = 'warning';
    } else {
      errorMessage = error.message || 'Error inesperado. Tu saldo será verificado.';
      errorType = 'error';
    }
    
    showToast(errorMessage, errorType);
    
    setTimeout(async () => {
      try {
        await loadUserBalance();
        showToast('Saldo actualizado correctamente', 'success');
      } catch (balanceError) {
        console.error('Error loading balance:', balanceError);
        showToast('No se pudo actualizar el saldo. Recarga la página.', 'error');
      }
    }, 1500);
    
    rouletteState.isSpinning = false;
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) spinBtn.disabled = false;
  }
}

async function animateSVGSpin(winningNumber) {
  const rouletteSvg = document.getElementById('rouletteSvg');
  const ball = document.getElementById('ball');
  const ballShadow = document.getElementById('ballShadow');

  if (!rouletteSvg || !ball || !ballShadow) {
    return;
  }
  const targetPocket = pocketData.find(p => p.num === winningNumber);
  if (!targetPocket) {
    console.error('Winning number pocket not found:', winningNumber);
    return;
  }

  const targetAngle = targetPocket.middleAngle;

  const centerX = 200;
  const centerY = 200;
  const rOuter = 170;
  const rInner = 125;
  const rBallMax = rOuter - 4;
  const rBallMin = rInner + 4;
  const rBallBandMid = (rBallMax + rBallMin) / 2;

  const spins = 5 + Math.random() * 2;
  const startAngle = targetAngle + spins * 2 * Math.PI;
  const duration = 4500; 

  return new Promise((resolve) => {
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const tRaw = Math.min(elapsed / duration, 1);

      const angleProgress = easeOutCubic(tRaw);
      const angle = startAngle + (targetAngle - startAngle) * angleProgress;

      const fallProgress = Math.pow(tRaw, 1.4);
      let rBase = rBallMax - (rBallMax - rBallBandMid) * fallProgress;

      const jitter =
        2 * Math.sin(angle * 4) * (1 - tRaw) +
        1 * Math.sin(angle * 7 + 1.2) * (1 - tRaw);

      let rTrack = clamp(rBase + jitter, rBallMin, rBallMax);

      let px = centerX + rTrack * Math.cos(angle);
      let py = centerY + rTrack * Math.sin(angle);

      const bounce = 0.8 * Math.abs(Math.sin(10 * Math.PI * tRaw)) * (1 - tRaw);
      const radialBounce = 2 * bounce;
      rTrack = clamp(rTrack - radialBounce, rBallMin, rBallMax);

      px = centerX + rTrack * Math.cos(angle);
      py = centerY + rTrack * Math.sin(angle);

      const ballRadius = 7 + 2 * bounce;

      const rShadow = rTrack - 6;
      const sx = centerX + rShadow * Math.cos(angle);
      const sy = centerY + rShadow * Math.sin(angle) + 3;

      ball.setAttribute("cx", px);
      ball.setAttribute("cy", py);
      ball.setAttribute("r", ballRadius);

      ballShadow.setAttribute("cx", sx);
      ballShadow.setAttribute("cy", sy);

      let zoom = 1;
      if (tRaw > 0.78) {
        const tz = (tRaw - 0.78) / 0.22;
        zoom = 1 + 0.2 * Math.sin(Math.PI * tz);
      }
      rouletteSvg.style.transform = `scale(${zoom})`;

      if (tRaw < 1) {
        requestAnimationFrame(animate);
      } else {
        
        rouletteSvg.style.transform = "scale(1)";

        const finalR = rBallBandMid;
        const finalX = centerX + finalR * Math.cos(targetAngle);
        const finalY = centerY + finalR * Math.sin(targetAngle);
        ball.setAttribute("cx", finalX);
        ball.setAttribute("cy", finalY);
        ball.setAttribute("r", 7);

        const shadowR = finalR - 6;
        const finalSX = centerX + shadowR * Math.cos(targetAngle);
        const finalSY = centerY + shadowR * Math.sin(targetAngle) + 3;
        ballShadow.setAttribute("cx", finalSX);
        ballShadow.setAttribute("cy", finalSY);

        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}



function highlightWinningNumber(number) {

  clearHighlights();
  const winningPocket = pocketData.find(p => p.num === number);
  if (winningPocket) {
    winningPocket.path.classList.add('win');
  }

  highlightBetCell(number);

  createWinParticles(number);
}

function displayResult(data) {
  const resultDisplay = document.querySelector('.result-display');
  const messageEl = document.getElementById('resultMessage');
  const numberEl = document.getElementById('resultNumber');
  const winningsEl = document.getElementById('resultWinnings');

  if (!resultDisplay) return;

  const wheelColor = getNumberColor(data.wheelNumber);

  messageEl.textContent = data.message;
  numberEl.textContent = data.wheelNumber;
  numberEl.className = `result-number ${wheelColor}`;

  if (data.totalWin > 0) {
    winningsEl.textContent = `¡GANASTE! +$${data.totalWin.toLocaleString()}`;
    winningsEl.className = 'result-winnings';
  } else {
    winningsEl.textContent = 'PERDISTE ESTA RONDA';
    winningsEl.className = 'result-winnings lose';
  }

  resultDisplay.classList.add('show');

  setTimeout(() => {
    resultDisplay.classList.remove('show');
  }, 5000);
}

function getNumberColor(number) {
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  if (number === 0) return 'green';
  return RED_NUMBERS.includes(number) ? 'red' : 'black';
}

function highlightBetCell(number) {
 
  document.querySelectorAll('.bet-cell.hit, .zero-shape.hit').forEach(el => el.classList.remove('hit'));
  
  const numberCells = document.querySelectorAll(`[data-bet-value="${number}"]`);
  numberCells.forEach(cell => {
    cell.classList.add('hit');
  });

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  if (number >= 1 && number <= 12) {
    document.querySelectorAll('[data-bet-type="dozen_1st"]').forEach(el => el.classList.add('hit'));
  } else if (number >= 13 && number <= 24) {
    document.querySelectorAll('[data-bet-type="dozen_2nd"]').forEach(el => el.classList.add('hit'));
  } else if (number >= 25 && number <= 36) {
    document.querySelectorAll('[data-bet-type="dozen_3rd"]').forEach(el => el.classList.add('hit'));
  }

  if (number % 3 === 1 && number !== 0) {
    document.querySelectorAll('[data-bet-type="column_1st"]').forEach(el => el.classList.add('hit'));
  } else if (number % 3 === 2 && number !== 0) {
    document.querySelectorAll('[data-bet-type="column_2nd"]').forEach(el => el.classList.add('hit'));
  } else if (number % 3 === 0 && number !== 0) {
    document.querySelectorAll('[data-bet-type="column_3rd"]').forEach(el => el.classList.add('hit'));
  }

  if (number >= 1 && number <= 18) {
    document.querySelectorAll('[data-bet-type="low"]').forEach(el => el.classList.add('hit'));
  } else if (number >= 19 && number <= 36) {
    document.querySelectorAll('[data-bet-type="high"]').forEach(el => el.classList.add('hit'));
  }

  if (number % 2 === 0 && number !== 0) {
    document.querySelectorAll('[data-bet-type="even"]').forEach(el => el.classList.add('hit'));
  } else if (number % 2 === 1) {
    document.querySelectorAll('[data-bet-type="odd"]').forEach(el => el.classList.add('hit'));
  }

  if (RED_NUMBERS.includes(number)) {
    document.querySelectorAll('[data-bet-type="red"]').forEach(el => el.classList.add('hit'));
  } else if (BLACK_NUMBERS.includes(number)) {
    document.querySelectorAll('[data-bet-type="black"]').forEach(el => el.classList.add('hit'));
  }

  setTimeout(() => {
    document.querySelectorAll('.bet-cell.hit, .zero-shape.hit').forEach(el => el.classList.remove('hit'));
  }, 3000);
}

function createWinParticles(number) {

  const cell = document.querySelector(`.bet-cell[data-bet-type="straight"][data-bet-value="${number}"]`) ||
               document.querySelector(`.zero-shape[data-bet-value="${number}"]`);
  
  if (!cell) return;
  
  const rect = cell.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.background = 'radial-gradient(circle, #ffd700, #ffed4e)';
      particle.style.boxShadow = '0 0 10px #ffd700, 0 0 20px #ffd700';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '1000';
      
      document.body.appendChild(particle);
      
      const angle = (Math.PI * 2 * i) / 15;
      const velocity = 100 + Math.random() * 150;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 100;
      
      let x = centerX;
      let y = centerY;
      let opacity = 1;
      let vy_current = vy;
      
      const animateParticle = () => {
        vy_current += 5;
        x += vx * 0.016;
        y += vy_current * 0.016;
        opacity -= 0.015;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = opacity;
        
        if (opacity > 0) {
          requestAnimationFrame(animateParticle);
        } else {
          particle.remove();
        }
      };
      
      requestAnimationFrame(animateParticle);
    }, i * 30);
  }
}

function updateLastResults() {
  const resultsDisplay = document.getElementById('lastResults');
  if (!resultsDisplay) return;

  resultsDisplay.innerHTML = '';

  rouletteState.lastResults.forEach(number => {
    const color = getNumberColor(number);
    const badge = document.createElement('div');
    badge.className = `result-badge ${color}`;
    badge.textContent = number;
    resultsDisplay.appendChild(badge);
  });
}

function resetGame() {
  rouletteState.bets = [];
  rouletteState.lastResults = [];

  updateBetsSummary();
  updateTotalBet();
  updateLastResults();
  clearChipsFromBoard();

  const resultDisplay = document.querySelector('.result-display');
  if (resultDisplay) resultDisplay.classList.remove('show');


  clearHighlights();

  const rouletteSvg = document.getElementById('rouletteSvg');
  if (rouletteSvg) rouletteSvg.style.transform = 'scale(1)';

  showToast('Juego reiniciado', 'success');
}

function updateBalanceDisplay() {
  const balanceAmount = document.getElementById('balanceAmount');
  const menuBalance = document.getElementById('menuBalance');

  const formattedBalance = typeof rouletteState.userBalance === 'number'
    ? rouletteState.userBalance.toLocaleString()
    : '0';

  if (balanceAmount) {
    balanceAmount.textContent = `$${formattedBalance}`;
  }
  if (menuBalance) {
    menuBalance.textContent = `$${formattedBalance}`;
  }
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
