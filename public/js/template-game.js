// Template Game - JavaScript de demostración
'use strict';

// ========================================
// ESTADO DEL JUEGO
// ========================================
const gameState = {
    balance: 5000,
    currentBet: 100,
    minBet: 10,
    maxBet: 10000
};

// ========================================
// DOM ELEMENTS
// ========================================
const balanceAmount = document.getElementById('balanceAmount');
const betAmountInput = document.getElementById('betAmountInput');
const clearBtn = document.getElementById('clearBtn');
const increaseBetBtn = document.getElementById('increaseBetBtn');
const decreaseBetBtn = document.getElementById('decreaseBetBtn');
const toggleChipsBtn = document.getElementById('toggleChipsBtn');
const chipsSection = document.getElementById('chipsSection');
const betDisplayGroup = document.querySelector('.bet-display-group');
const compactBetDisplay = document.querySelector('.compact-bet-display');
const compactBetAmount = document.getElementById('compactBetAmount');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const toast = document.getElementById('toast');
const winOverlay = document.getElementById('winOverlay');
const loseOverlay = document.getElementById('loseOverlay');

// Variables para control de doble clic en fichas
let lastChipClickTime = 0;
let lastChipValue = null;
const DOUBLE_CLICK_DELAY = 400; // ms

// Estado del panel de fichas
let chipsExpanded = false;

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

// Botones de acción
const actionBtn1 = document.getElementById('actionBtn1');
const actionBtn2 = document.getElementById('actionBtn2');
const actionBtn3 = document.getElementById('actionBtn3');

// ========================================
// INICIALIZACIÓN
// ========================================
function initGame() {
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
    showToast('¡Bienvenido al Template Game! 🎮', 'success');
}

// ========================================
// ACTUALIZAR UI
// ========================================
function updateBalance() {
    if (balanceAmount) {
        balanceAmount.textContent = `$${gameState.balance.toLocaleString()}`;
    }
    const menuBalance = document.getElementById('menuBalance');
    if (menuBalance) {
        menuBalance.textContent = `$${gameState.balance.toLocaleString()}`;
    }
}

function updateCurrentBetDisplay() {
    if (betAmountInput) {
        betAmountInput.value = gameState.currentBet;
    }
    if (compactBetAmount) {
        compactBetAmount.textContent = `$${gameState.currentBet.toLocaleString()}`;
    }
}

// ========================================
// FUNCIONES DE APUESTA
// ========================================
function clearBet() {
    gameState.currentBet = 10;
    updateCurrentBetDisplay();
    showToast('Apuesta restablecida a $10', 'info');
}

function setBet(amount, accumulate = false) {
    let newBet;
    
    if (accumulate) {
        newBet = gameState.currentBet + parseInt(amount);
    } else {
        newBet = parseInt(amount);
    }
    
    if (isNaN(newBet) || newBet < gameState.minBet) {
        gameState.currentBet = gameState.minBet;
        showToast(`Apuesta mínima: $${gameState.minBet}`, 'warning');
    } else if (newBet > gameState.maxBet) {
        gameState.currentBet = gameState.maxBet;
        showToast(`Apuesta máxima: $${gameState.maxBet}`, 'warning');
    } else if (newBet > gameState.balance) {
        gameState.currentBet = Math.min(gameState.balance, gameState.maxBet);
        showToast('Saldo insuficiente', 'error');
    } else {
        gameState.currentBet = newBet;
    }
    
    updateCurrentBetDisplay();
    
    // Actualizar estado visual de las fichas
    document.querySelectorAll('.casino-chip').forEach(chip => {
        chip.classList.remove('selected');
    });
}

// ========================================
// TOGGLE CHIPS PANEL
// ========================================
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

// ========================================
// MENÚ LATERAL
// ========================================
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

// ========================================
// MODALES DE REGLAS Y PREMIOS
// ========================================
function openRulesModal() {
    if (!rulesModal) return;
    
    // Contenido de reglas de ejemplo - cada juego debe personalizar esto
    rulesModalBody.innerHTML = `
        <h3><i class="fas fa-gamepad"></i> Objetivo del Juego</h3>
        <p>Bienvenido al Template Game. Este es un juego de ejemplo que muestra cómo funcionan las reglas y premios.</p>
        
        <h3><i class="fas fa-play-circle"></i> Cómo Jugar</h3>
        <ul>
            <li>Selecciona tu apuesta usando las fichas o ingresando un monto</li>
            <li>Presiona uno de los botones de acción para jugar</li>
            <li>El resultado se mostrará en pantalla</li>
            <li>Tus ganancias se añadirán automáticamente a tu saldo</li>
        </ul>
        
        <h3><i class="fas fa-coins"></i> Apuestas</h3>
        <ul>
            <li>Apuesta mínima: $${gameState.minBet.toLocaleString()}</li>
            <li>Apuesta máxima: $${gameState.maxBet.toLocaleString()}</li>
            <li>Puedes usar las fichas rápidas o ingresar un monto personalizado</li>
        </ul>
        
        <div class="highlight-box">
            <h4><i class="fas fa-lightbulb"></i> Consejo</h4>
            <p>Administra tu saldo sabiamente. No apuestes más de lo que puedes permitirte perder.</p>
        </div>
        
        <div class="highlight-box warning">
            <h4><i class="fas fa-exclamation-triangle"></i> Importante</h4>
            <p>Este es un juego de casino. Los resultados son aleatorios y la casa siempre tiene ventaja.</p>
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
    
    // Contenido de premios de ejemplo - cada juego debe personalizar esto
    prizesModalBody.innerHTML = `
        <h3><i class="fas fa-trophy"></i> Tabla de Pagos</h3>
        <p>Los pagos varían según el tipo de victoria que obtengas:</p>
        
        <table class="prize-table">
            <thead>
                <tr>
                    <th>Resultado</th>
                    <th>Descripción</th>
                    <th>Pago</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><i class="fas fa-crown" style="color: gold;"></i> Victoria Normal</td>
                    <td>Ganas la ronda básica</td>
                    <td>2x</td>
                </tr>
                <tr>
                    <td><i class="fas fa-star" style="color: #9333ea;"></i> Victoria Especial</td>
                    <td>Ganas con combinación especial</td>
                    <td>5x</td>
                </tr>
                <tr>
                    <td><i class="fas fa-gem" style="color: #06b6d4;"></i> Victoria Premium</td>
                    <td>Máxima combinación posible</td>
                    <td>10x</td>
                </tr>
                <tr>
                    <td><i class="fas fa-fire" style="color: #ef4444;"></i> Jackpot</td>
                    <td>Premio mayor del juego</td>
                    <td>100x</td>
                </tr>
            </tbody>
        </table>
        
        <h3><i class="fas fa-percentage"></i> Probabilidades</h3>
        <ul>
            <li>Victoria Normal: ~40% de probabilidad</li>
            <li>Victoria Especial: ~15% de probabilidad</li>
            <li>Victoria Premium: ~5% de probabilidad</li>
            <li>Jackpot: ~0.1% de probabilidad</li>
        </ul>
        
        <div class="highlight-box">
            <h4><i class="fas fa-chart-line"></i> RTP (Return to Player)</h4>
            <p>Este juego tiene un RTP del 96.5%, lo que significa que por cada $100 apostados, se devuelven $96.50 en promedio a largo plazo.</p>
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

// ========================================
// PANTALLA COMPLETA
// ========================================
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

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'info') {
    if (!toast) return;
    
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('i');
    
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    // Cambiar ícono según tipo
    if (toastIcon) {
        toastIcon.className = 'fas';
        switch(type) {
            case 'success':
                toastIcon.classList.add('fa-check-circle');
                break;
            case 'error':
                toastIcon.classList.add('fa-exclamation-circle');
                break;
            case 'warning':
                toastIcon.classList.add('fa-exclamation-triangle');
                break;
            default:
                toastIcon.classList.add('fa-info-circle');
        }
    }
    
    // Aplicar clase de tipo
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// OVERLAYS
// ========================================
function showWinOverlay(amount, message) {
    if (!winOverlay) return;
    
    const winAmount = document.getElementById('winAmount');
    const winHand = document.getElementById('winHand');
    
    if (winAmount) {
        winAmount.textContent = `+$${amount.toLocaleString()}`;
    }
    if (winHand) {
        winHand.textContent = message || '¡GANASTE!';
    }
    
    winOverlay.classList.add('show');
    
    setTimeout(() => {
        winOverlay.classList.remove('show');
    }, 3000);
}

function showLoseOverlay(amount, message) {
    if (!loseOverlay) return;
    
    const loseAmount = document.getElementById('loseAmount');
    const loseMessage = document.getElementById('loseMessage');
    
    if (loseAmount) {
        loseAmount.textContent = `-$${amount.toLocaleString()}`;
    }
    if (loseMessage) {
        loseMessage.textContent = message || 'Perdiste';
    }
    
    loseOverlay.classList.add('show');
    
    setTimeout(() => {
        loseOverlay.classList.remove('show');
    }, 3000);
}

// ========================================
// ACCIONES DE EJEMPLO
// ========================================
function handleAction1() {
    if (gameState.currentBet > gameState.balance) {
        showToast('Saldo insuficiente', 'error');
        return;
    }
    
    showToast('Ejecutando Acción 1...', 'info');
    
    // Simular ganancia
    setTimeout(() => {
        const winAmount = gameState.currentBet * 2;
        gameState.balance += winAmount;
        updateBalance();
        showWinOverlay(winAmount, '¡VICTORIA!');
    }, 1500);
}

function handleAction2() {
    showToast('Acción 2 ejecutada', 'success');
}

function handleAction3() {
    if (gameState.currentBet > gameState.balance) {
        showToast('Saldo insuficiente', 'error');
        return;
    }
    
    showToast('Ejecutando Acción 3...', 'warning');
    
    // Simular pérdida
    setTimeout(() => {
        gameState.balance -= gameState.currentBet;
        updateBalance();
        showLoseOverlay(gameState.currentBet, 'Perdiste esta ronda');
    }, 1500);
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Botón limpiar apuesta
    if (clearBtn) {
        clearBtn.addEventListener('click', clearBet);
    }
    
    // Toggle chips panel
    if (toggleChipsBtn) {
        toggleChipsBtn.addEventListener('click', toggleChipsPanel);
    }
    
    // Botones de aumentar/disminuir apuesta
    if (increaseBetBtn) {
        increaseBetBtn.addEventListener('click', () => {
            setBet(gameState.currentBet + 10);
        });
    }
    
    if (decreaseBetBtn) {
        decreaseBetBtn.addEventListener('click', () => {
            setBet(gameState.currentBet - 10);
        });
    }
    
    // Input manual de apuesta
    if (betAmountInput) {
        betAmountInput.addEventListener('input', (e) => {
            // Permitir vaciar el campo completamente mientras escribe
            const value = e.target.value;
            if (value === '' || value === '0') {
                // No validar mientras está vacío
                return;
            }
            // Solo actualizar si hay un valor válido
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                gameState.currentBet = numValue;
            }
        });
        
        betAmountInput.addEventListener('blur', (e) => {
            // Validar solo al perder el foco
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < gameState.minBet) {
                setBet(gameState.minBet);
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
    
    // Fichas de casino con lógica de doble clic
    document.querySelectorAll('.casino-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const value = parseInt(chip.dataset.value);
            const currentTime = Date.now();
            
            // Verificar si es doble clic en la misma ficha
            if (lastChipValue === value && (currentTime - lastChipClickTime) < DOUBLE_CLICK_DELAY) {
                // Doble clic: establecer exactamente ese valor
                setBet(value, false);
                lastChipClickTime = 0;
                lastChipValue = null;
            } else {
                // Primer clic: acumular
                setBet(value, true);
                lastChipClickTime = currentTime;
                lastChipValue = value;
            }
        });
    });
    
    // Menú
    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
    }
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Pantalla completa
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Botones de acción
    if (actionBtn1) {
        actionBtn1.addEventListener('click', handleAction1);
    }
    if (actionBtn2) {
        actionBtn2.addEventListener('click', handleAction2);
    }
    if (actionBtn3) {
        actionBtn3.addEventListener('click', handleAction3);
    }
    
    // Cerrar overlays al hacer click
    if (winOverlay) {
        winOverlay.addEventListener('click', () => {
            winOverlay.classList.remove('show');
        });
    }
    if (loseOverlay) {
        loseOverlay.addEventListener('click', () => {
            loseOverlay.classList.remove('show');
        });
    }
    
    // Modales de reglas y premios
    if (rulesBtn) {
        rulesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openRulesModal();
        });
    }
    if (rulesModalClose) {
        rulesModalClose.addEventListener('click', closeRulesModal);
    }
    if (rulesModalOverlay) {
        rulesModalOverlay.addEventListener('click', closeRulesModal);
    }
    
    if (prizesBtn) {
        prizesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openPrizesModal();
        });
    }
    if (prizesModalClose) {
        prizesModalClose.addEventListener('click', closePrizesModal);
    }
    if (prizesModalOverlay) {
        prizesModalOverlay.addEventListener('click', closePrizesModal);
    }
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeRulesModal();
            closePrizesModal();
            closeMenu();
        }
    });
}

// ========================================
// INICIAR AL CARGAR
// ========================================
window.addEventListener('DOMContentLoaded', initGame);
