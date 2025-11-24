// Blackjack Game
'use strict';

// ========================================
// ESTADO DEL JUEGO
// ========================================
const gameState = {
    balance: 0,
    currentBet: 100,
    minBet: 10,
    maxBet: 10000,
    playerHand: [],
    dealerHand: [],
    playerValue: 0,
    dealerValue: 0,
    gameInProgress: false,
    gameResult: null
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
const compactBetAmount = document.getElementById('compactBetAmount');
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const toast = document.getElementById('toast');

// Overlays de victoria/derrota
const winOverlay = document.getElementById('winOverlay');
const winAmount = document.getElementById('winAmount');
const winHand = document.getElementById('winHand');
const loseOverlay = document.getElementById('loseOverlay');
const loseAmount = document.getElementById('loseAmount');
const loseMessage = document.getElementById('loseMessage');

// Resultados en pantalla (como poker)
const dealerResult = document.getElementById('dealerResult');
const handResult = document.getElementById('handResult');

// Botones de juego
const dealBtn = document.getElementById('dealBtn');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');

// Estado del panel de fichas
let chipsExpanded = false;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Blackjack game loading...');
    
    // Inicializar estado colapsado en móvil
    if (chipsSection) {
        chipsSection.classList.add('collapsed');
    }
    if (toggleChipsBtn) {
        toggleChipsBtn.classList.add('collapsed');
    }
    
    loadUserBalance();
    updateCurrentBetDisplay();
    setupEventListeners();
    setupMenuListeners();
    updateButtonStates();
});

// ========================================
// CARGAR SALDO DEL USUARIO
// ========================================
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
            gameState.balance = data.balance;
            updateBalance();
            console.log('Balance loaded successfully:', gameState.balance);
        } else {
            console.error('Invalid balance data:', data);
            gameState.balance = 0;
            updateBalance();
        }
    } catch (error) {
        console.error('Error loading balance:', error);
        showToast('Error al cargar saldo: ' + error.message, 'error');
        gameState.balance = 0;
        updateBalance();
    }
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
    
    if (chipsExpanded) {
        chipsSection?.classList.remove('collapsed');
        toggleChipsBtn?.classList.remove('collapsed');
        document.querySelector('.bet-display-group')?.classList.remove('collapsed');
        document.querySelector('.compact-bet-display')?.classList.remove('show');
    } else {
        chipsSection?.classList.add('collapsed');
        toggleChipsBtn?.classList.add('collapsed');
        document.querySelector('.bet-display-group')?.classList.add('collapsed');
        document.querySelector('.compact-bet-display')?.classList.add('show');
    }
    
    // Rotar icono
    const icon = toggleChipsBtn?.querySelector('.toggle-icon');
    if (icon) {
        icon.style.transform = chipsExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
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

function setupMenuListeners() {
    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Botones del menú
    const rulesBtn = document.getElementById('rulesBtn');
    const prizesBtn = document.getElementById('prizesBtn');
    
    if (rulesBtn) {
        rulesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showRulesModal();
        });
    }
    
    if (prizesBtn) {
        prizesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPrizesModal();
        });
    }
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

// ========================================
// MODALES
// ========================================
function showRulesModal() {
    const modal = document.getElementById('rulesModal');
    const body = document.getElementById('rulesModalBody');
    const title = document.getElementById('rulesModalTitle');
    
    if (title) title.textContent = 'Reglas del Blackjack';
    
    if (body) {
        body.innerHTML = `
            <h3>Objetivo</h3>
            <p>Obtener una mano con valor más cercano a 21 que el crupier, sin pasarse.</p>
            
            <h3>Valores de las Cartas</h3>
            <ul>
                <li>Cartas numéricas (2-10): su valor nominal</li>
                <li>Figuras (J, Q, K): valen 10</li>
                <li>As: vale 1 u 11 (el que sea más favorable)</li>
            </ul>
            
            <h3>Cómo Jugar</h3>
            <ol>
                <li>Coloca tu apuesta usando las fichas</li>
                <li>Haz clic en REPARTIR para comenzar</li>
                <li>Recibes 2 cartas boca arriba</li>
                <li>El crupier recibe 1 carta visible y 1 oculta</li>
                <li>Decide si PEDIR más cartas o PLANTARTE</li>
                <li>El crupier juega según las reglas de la casa</li>
            </ol>
            
            <h3>Blackjack</h3>
            <p>Si recibes un As y una carta de valor 10 en las primeras 2 cartas, ¡es Blackjack! Pagas 2.5:1</p>
            
            <h3>Reglas del Crupier</h3>
            <ul>
                <li>Debe pedir carta con 16 o menos</li>
                <li>Debe plantarse con 17 o más</li>
            </ul>
        `;
    }
    
    if (modal) {
        modal.classList.add('show');
    }
    
    // Event listeners para cerrar
    const closeBtn = document.getElementById('rulesModalClose');
    const overlay = document.getElementById('rulesModalOverlay');
    
    if (closeBtn) {
        closeBtn.onclick = () => modal?.classList.remove('show');
    }
    if (overlay) {
        overlay.onclick = () => modal?.classList.remove('show');
    }
}

function showPrizesModal() {
    const modal = document.getElementById('prizesModal');
    const body = document.getElementById('prizesModalBody');
    
    if (body) {
        body.innerHTML = `
            <h3><i class="fas fa-trophy"></i> Tabla de Pagos de Blackjack</h3>
            <p>Los pagos en Blackjack se basan en el resultado de tu mano contra la del crupier:</p>
            
            <table class="prize-table">
                <thead>
                    <tr>
                        <th>Resultado</th>
                        <th>Pago</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><i class="fas fa-star" style="color: #daa520;"></i> <strong>Blackjack Natural</strong></td>
                        <td>2.5:1</td>
                        <td>As + carta de 10 en las primeras 2 cartas</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-trophy" style="color: #daa520;"></i> <strong>Ganar</strong></td>
                        <td>2:1</td>
                        <td>Tu mano es mejor que la del crupier</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-handshake" style="color: #9333ea;"></i> <strong>Empate (Push)</strong></td>
                        <td>1:1</td>
                        <td>Misma puntuación que el crupier - apuesta devuelta</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-times-circle" style="color: #dc2626;"></i> <strong>Perder</strong></td>
                        <td>0:1</td>
                        <td>El crupier tiene mejor mano o te pasaste de 21</td>
                    </tr>
                </tbody>
            </table>
            
            <h3><i class="fas fa-coins"></i> Ejemplos de Pago</h3>
            <div class="highlight-box">
                <h4>Con una apuesta de $100:</h4>
                <ul>
                    <li><strong>Blackjack Natural:</strong> Ganas <strong>$250</strong> (2.5x tu apuesta)</li>
                    <li><strong>Ganas la mano:</strong> Ganas <strong>$200</strong> (2x tu apuesta)</li>
                    <li><strong>Empate:</strong> Recuperas tus <strong>$100</strong> (apuesta devuelta)</li>
                    <li><strong>Pierdes:</strong> Pierdes tus <strong>$100</strong></li>
                </ul>
            </div>
            
            <h3><i class="fas fa-chart-line"></i> Estrategia Básica</h3>
            <div class="highlight-box warning">
                <h4><i class="fas fa-lightbulb"></i> Consejos para Jugar Mejor</h4>
                <ul>
                    <li>Pide carta (HIT) si tienes 11 o menos - no puedes pasarte</li>
                    <li>Plántate (STAND) si tienes 17 o más</li>
                    <li>Con 12-16, observa la carta visible del crupier</li>
                    <li>El As puede valer 1 u 11 - el juego elige el valor más favorable</li>
                </ul>
            </div>
          
            
            <div class="highlight-box">
                <h4><i class="fas fa-info-circle"></i> Reglas del Crupier</h4>
                <p>El crupier sigue reglas estrictas:</p>
                <ul>
                    <li>Debe pedir carta con 16 o menos</li>
                    <li>Debe plantarse con 17 o más</li>
                    <li>No puede tomar decisiones estratégicas</li>
                </ul>
            </div>
        `;
    }
    
    if (modal) {
        modal.classList.add('show');
    }
    
    closeMenu();
    
    // Event listeners para cerrar
    const closeBtn = document.getElementById('prizesModalClose');
    const overlay = document.getElementById('prizesModalOverlay');
    
    if (closeBtn) {
        closeBtn.onclick = () => modal?.classList.remove('show');
    }
    if (overlay) {
        overlay.onclick = () => modal?.classList.remove('show');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Toggle chips panel
    if (toggleChipsBtn) {
        toggleChipsBtn.addEventListener('click', toggleChipsPanel);
    }

    // Botones de apuesta
    if (clearBtn) {
        clearBtn.addEventListener('click', clearBet);
    }

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
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                setBet(value);
            }
        });
    }

    // Fichas de casino
    document.querySelectorAll('.casino-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            
            // Marcar ficha como seleccionada
            document.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            // Acumular valor
            setBet(value, true);
        });
    });

    // Botones de juego
    if (dealBtn) dealBtn.addEventListener('click', dealHand);
    if (hitBtn) hitBtn.addEventListener('click', hitHand);
    if (standBtn) standBtn.addEventListener('click', standHand);
}

// ========================================
// LÓGICA DEL JUEGO
// ========================================
function resetGameState() {
    // Limpiar las manos de la partida anterior
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.playerValue = 0;
    gameState.dealerValue = 0;
    gameState.gameInProgress = false;
    gameState.gameResult = null;
    console.log('[BLACKJACK] Estado limpiado');
}

async function dealHand() {
    // Limpiar estado anterior
    resetGameState();
    
    const betAmount = gameState.currentBet || 100;

    if (betAmount <= 0) {
        showToast('Selecciona una apuesta válida', 'error');
        return;
    }

    if (betAmount > gameState.balance) {
        showToast('Saldo insuficiente para esa apuesta', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('nimetsuCasinoToken');
        
        const response = await fetch('/api/blackjack/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bet: betAmount })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Error al iniciar juego', 'error');
            return;
        }

        // Update game state
        gameState.playerHand = data.playerHand;
        gameState.dealerHand = data.dealerHand;
        gameState.playerValue = data.playerValue;
        gameState.dealerValue = data.dealerValue;
        gameState.gameInProgress = true;
        gameState.balance = data.newBalance;

        // Update UI
        updateBalance();
        displayCards();
        updateButtonStates();

        // Check for blackjack
        if (data.playerBlackjack && data.dealerBlackjack) {
            gameState.gameInProgress = false;
            gameState.balance = data.newBalance + gameState.currentBet;
            updateBalance();
            displayCards();
            showToast('¡AMBOS TIENEN BLACKJACK! - EMPATE', 'info');
            updateButtonStates();
        } else if (data.playerBlackjack) {
            gameState.gameInProgress = false;
            gameState.dealerHand = data.dealerHand;
            const winAmount = Math.floor(gameState.currentBet * 2.5);
            gameState.balance = data.newBalance + winAmount;
            updateBalance();
            displayCards();
            showWinOverlay(winAmount, '¡BLACKJACK NATURAL!');
            updateButtonStates();
        }

    } catch (error) {
        console.error('Error dealing hand:', error);
        showToast('Error al repartir cartas: ' + error.message, 'error');
    }
}

async function hitHand() {
    if (!gameState.gameInProgress) return;

    try {
        const token = localStorage.getItem('nimetsuCasinoToken');

        const response = await fetch('/api/blackjack/hit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                playerHand: gameState.playerHand,
                dealerHand: gameState.dealerHand,
                bet: gameState.currentBet
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Error', 'error');
            return;
        }

        gameState.playerHand = data.playerHand;
        gameState.playerValue = data.playerValue;

        // Añadir la nueva carta con animación
        addNewCardWithAnimation(true);

        if (data.bust) {
            setTimeout(() => {
                gameState.gameInProgress = false;
                showLoseOverlay(gameState.currentBet, 'Te pasaste de 21');
                gameState.balance = data.newBalance;
                updateBalance();
                updateButtonStates();
            }, 800);
        }

    } catch (error) {
        console.error('Error hitting:', error);
        showToast('Error al pedir carta', 'error');
    }
}

async function standHand() {
    if (!gameState.gameInProgress) return;

    try {
        const token = localStorage.getItem('nimetsuCasinoToken');

        const response = await fetch('/api/blackjack/stand', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                playerHand: gameState.playerHand,
                dealerHand: gameState.dealerHand,
                bet: gameState.currentBet
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Error', 'error');
            return;
        }

        gameState.gameInProgress = false;
        gameState.gameResult = data.result;
        gameState.balance = data.newBalance;

        // Revelar carta oculta del dealer
        revealDealerCard();
        
        // Esperar a que se revele la carta oculta antes de añadir nuevas
        setTimeout(() => {
            const cardsToAdd = data.dealerHand.length - gameState.dealerHand.length;
            gameState.dealerHand = data.dealerHand;
            gameState.dealerValue = data.dealerValue;
            
            if (cardsToAdd > 0) {
                // Añadir cartas adicionales del dealer una por una
                for (let i = 0; i < cardsToAdd; i++) {
                    setTimeout(() => {
                        addNewCardWithAnimation(false);
                    }, i * 700);
                }
                
                // Mostrar resultado después de todas las animaciones
                setTimeout(() => {
                    updateHandValues();
                    updateBalance();
                    displayResult(data);
                    updateButtonStates();
                }, cardsToAdd * 700 + 500);
            } else {
                // Sin cartas adicionales, mostrar resultado inmediatamente
                setTimeout(() => {
                    updateHandValues();
                    updateBalance();
                    displayResult(data);
                    updateButtonStates();
                }, 300);
            }
        }, 600);

    } catch (error) {
        console.error('Error standing:', error);
        showToast('Error al terminar juego', 'error');
    }
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================
function displayCards() {
    const dealerDisplay = document.getElementById('dealerCards');
    const playerDisplay = document.getElementById('playerCards');

    if (!dealerDisplay || !playerDisplay) return;

    // Limpiar contenedores
    dealerDisplay.innerHTML = '';
    playerDisplay.innerHTML = '';

    // Mostrar cartas del dealer con animación
    gameState.dealerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.id = `dealerCard${index}`;
        cardDiv.innerHTML = '<div class="card-back"></div>';
        dealerDisplay.appendChild(cardDiv);

        setTimeout(() => {
            // Segunda carta oculta si el juego está en progreso
            const shouldHideCard = index === 1 && gameState.gameInProgress;
            
            if (!shouldHideCard && card.rank && card.suit) {
                const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
                cardDiv.classList.add('flip');
                
                setTimeout(() => {
                    cardDiv.innerHTML = `
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
            }
        }, index * 400);
    });

    // Mostrar cartas del jugador con animación
    gameState.playerHand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.id = `playerCard${index}`;
        cardDiv.innerHTML = '<div class="card-back"></div>';
        playerDisplay.appendChild(cardDiv);

        if (card.rank && card.suit) {
            setTimeout(() => {
                const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
                cardDiv.classList.add('flip');
                
                setTimeout(() => {
                    cardDiv.innerHTML = `
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
        }
    });

    updateHandValues();
}

function addNewCardWithAnimation(isPlayer = true) {
    const container = isPlayer ? document.getElementById('playerCards') : document.getElementById('dealerCards');
    const hand = isPlayer ? gameState.playerHand : gameState.dealerHand;
    const card = hand[hand.length - 1];
    
    if (!card || !card.rank || !card.suit) return;
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = '<div class="card-back"></div>';
    container.appendChild(cardDiv);
    
    setTimeout(() => {
        const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
        cardDiv.classList.add('flip');
        
        setTimeout(() => {
            cardDiv.innerHTML = `
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
            updateHandValues();
        }, 300);
    }, 100);
}

function revealDealerCard() {
    const dealerCard = document.getElementById('dealerCard1');
    const card = gameState.dealerHand[1];
    
    if (!dealerCard || !card || !card.rank || !card.suit) return;
    
    const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    dealerCard.classList.add('flip');
    
    setTimeout(() => {
        dealerCard.innerHTML = `
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
        updateHandValues();
    }, 300);
}

function updateHandValues() {
    const dealerValueEl = document.getElementById('dealerScore');
    const playerValueEl = document.getElementById('playerScore');

    // Si el juego está en progreso, mostrar solo la primera carta del dealer
    let visibleDealerValue = gameState.dealerValue;
    if (gameState.gameInProgress && gameState.dealerHand.length > 0) {
        visibleDealerValue = calculateDealerVisibleValue();
    }

    if (dealerValueEl) dealerValueEl.textContent = visibleDealerValue || '0';
    if (playerValueEl) playerValueEl.textContent = gameState.playerValue || '0';
}

function calculateDealerVisibleValue() {
    // Calcula el valor visible del dealer (solo primera carta durante el juego)
    if (gameState.dealerHand.length === 0) return 0;
    
    const card = gameState.dealerHand[0];
    if (card.rank === 'A') return 11;
    if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') return 10;
    return parseInt(card.rank);
}

function displayResult(data) {
    let message = '';
    
    switch (data.result) {
        case 'blackjack':
            message = `¡BLACKJACK NATURAL!`;
            showWinOverlay(data.winAmount, message);
            break;
        case 'win':
            if (data.dealerValue > 21) {
                message = `¡EL DEALER SE PASÓ!`;
            } else {
                message = `¡GANASTE LA MANO!`;
            }
            showWinOverlay(data.winAmount, message);
            break;
        case 'push':
            showToast(`EMPATE - Apuesta devuelta ($${data.winAmount})`, 'info');
            break;
        case 'lose':
            if (data.playerValue > 21) {
                message = 'Te pasaste de 21';
            } else {
                message = 'Perdiste la mano';
            }
            showLoseOverlay(gameState.currentBet, message);
            break;
        case 'bust':
            message = 'Te pasaste de 21';
            showLoseOverlay(gameState.currentBet, message);
            break;
    }
}

// Mostrar overlay de victoria
function showWinOverlay(amount, message) {
    if (winAmount) {
        winAmount.textContent = `+$${amount.toLocaleString()}`;
    }
    if (winHand) {
        winHand.textContent = message;
    }
    if (winOverlay) {
        winOverlay.classList.add('show');
        setTimeout(() => {
            winOverlay.classList.remove('show');
        }, 3000);
    }
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

function showGameStatus(message, statusClass) {
    // Ya no usamos esto, usamos overlays
}

function clearGameStatus() {
    if (handResult) {
        handResult.textContent = 'Haz tu apuesta para comenzar';
        handResult.className = 'hand-result';
    }
}

function updateButtonStates() {
    if (!dealBtn || !hitBtn || !standBtn) return;

    if (gameState.gameInProgress) {
        dealBtn.disabled = true;
        hitBtn.disabled = false;
        standBtn.disabled = false;
    } else {
        dealBtn.disabled = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;
    }
}

// ========================================
// UTILIDADES
// ========================================
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
