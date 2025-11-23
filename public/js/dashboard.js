// Elementos del DOM
const gameCards = document.querySelectorAll('.game-card');
const playButtons = document.querySelectorAll('.btn-play');
const confirmModal = document.getElementById('confirmModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');
const userNameEl = document.getElementById('userName');
const balanceAmountEl = document.getElementById('balanceAmount');
const gameName = document.getElementById('gameName');

// Mobile Menu Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navbarRight = document.getElementById('navbarRight');

// Account Sidebar Elements
const accountBtn = document.getElementById('accountBtn');
const accountSidebar = document.getElementById('accountSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const sidebarBalance = document.getElementById('sidebarBalance');
const logoutSidebarBtn = document.getElementById('logoutSidebarBtn');

// Account Options
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const profileSettingsBtn = document.getElementById('profileSettingsBtn');
const transactionHistoryBtn = document.getElementById('transactionHistoryBtn');
const gameHistoryBtn = document.getElementById('gameHistoryBtn');
const securityBtn = document.getElementById('securityBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');

let selectedGame = null;

// Juegos disponibles
const games = {
  slots: { name: 'Slots', icon: '🎰' },
  blackjack: { name: 'Blackjack', icon: '🃏' },
  roulette: { name: 'Ruleta', icon: '🎡' },
  poker: { name: 'Poker', icon: '♠️' },
  craps: { name: 'Dados', icon: '🎲' },
  baccarat: { name: 'Baccarat', icon: '💎' },
};

// Cargar datos del usuario al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  
  // Mobile Menu Toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      navbarRight.classList.toggle('active');
    });

    // Cerrar menú móvil al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!navbarRight.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mobileMenuToggle.classList.remove('active');
        navbarRight.classList.remove('active');
      }
    });

    // Cerrar menú móvil al hacer click en cualquier botón dentro
    navbarRight.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        mobileMenuToggle.classList.remove('active');
        navbarRight.classList.remove('active');
      }
    });
  }
  
  // Recargar balance cada 10 segundos
  setInterval(() => {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (token) {
      loadBalance(token);
    }
  }, 10000);
});

// Recargar balance cuando la ventana recupera el foco (usuario regresa de un juego)
window.addEventListener('focus', () => {
  const token = localStorage.getItem('nimetsuCasinoToken');
  if (token) {
    loadBalance(token);
  }
});

// Cargar datos del usuario desde localStorage
function loadUserData() {
  const token = localStorage.getItem('nimetsuCasinoToken');
  const userStr = localStorage.getItem('nimetsuCasinoUser');

  // Si no hay datos, simplemente no cargar (el servidor redirigirá)
  if (!token || !userStr) {
    return;
  }

  const user = JSON.parse(userStr);
  const displayName = user.nickname || user.email.split('@')[0];
  userNameEl.textContent = displayName;
  profileName.textContent = displayName;
  profileEmail.textContent = user.email;

  // Cargar balance del servidor
  loadBalance(token);
}

// Cargar balance del usuario
async function loadBalance(token) {
  try {
    console.log('Token enviado:', token);
    console.log('Header Authorization:', `Bearer ${token}`);

    const res = await fetch('/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Response status:', res.status);
    console.log('Response ok:', res.ok);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error response:', errorData);
      
      if (res.status === 401) {
        // Token expirado
        localStorage.clear();
        window.location.href = '/login';
      }
      return;
    }

    const data = await res.json();
    console.log('Balance data:', data);
    
    // Actualizar el balance real del usuario
    if (data.balance !== undefined) {
      const formattedBalance = `$${parseFloat(data.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      balanceAmountEl.textContent = formattedBalance;
      sidebarBalance.textContent = formattedBalance;
      
      // Guardar balance en localStorage para uso en juegos
      localStorage.setItem('nimetsuCasinoBalance', data.balance);
    } else {
      balanceAmountEl.textContent = '$0.00';
      sidebarBalance.textContent = '$0.00';
    }

    // Actualizar estadísticas si existen
    if (data.stats) {
      updateStats(data.stats);
    }
  } catch (err) {
    console.error('Error al cargar balance:', err);
    balanceAmountEl.textContent = '$0.00';
    sidebarBalance.textContent = '$0.00';
  }
}

// Actualizar estadísticas
function updateStats(stats) {
  const totalGamesEl = document.getElementById('totalGames');
  const totalWinsEl = document.getElementById('totalWins');
  const totalEarningsEl = document.getElementById('totalEarnings');

  if (totalGamesEl) totalGamesEl.textContent = stats.totalGames || 0;
  if (totalWinsEl) totalWinsEl.textContent = stats.totalWins || 0;
  if (totalEarningsEl) {
    const earnings = parseFloat(stats.totalEarnings || 0);
    totalEarningsEl.textContent = `$${Math.abs(earnings).toFixed(0)}`;
    totalEarningsEl.style.color = earnings >= 0 ? '#10b981' : '#ef4444';
  }
}

// Event listeners para botones de juego
playButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const gameId = btn.getAttribute('data-game');
    selectedGame = gameId;
    gameName.textContent = games[gameId].name;
    openModal();
  });
});

// Event listeners para tarjetas de juego
gameCards.forEach(card => {
  card.addEventListener('click', () => {
    const gameId = card.getAttribute('data-game');
    selectedGame = gameId;
    gameName.textContent = games[gameId].name;
    openModal();
  });
});

// Abrir modal
function openModal() {
  confirmModal.classList.add('active');
}

// Cerrar modal
function closeModal() {
  confirmModal.classList.remove('active');
}

// Cancel button
cancelBtn.addEventListener('click', () => {
  closeModal();
});

// Confirm button - Ir al juego
confirmBtn.addEventListener('click', () => {
  if (selectedGame) {
    closeModal();
    showToast(`Iniciando ${games[selectedGame].name}...`, 'success');
    
    setTimeout(() => {
      // Redirigir al juego
      const gameRoutes = {
        blackjack: '/blackjack',
        roulette: '/roulette',
        slots: '/slots',
        poker: '/poker',
        craps: '/craps',
        baccarat: '/baccarat'
      };
      window.location.href = gameRoutes[selectedGame] || `/game/${selectedGame}`;
    }, 1500);
  }
});

// Cerrar modal al hacer click fuera
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    closeModal();
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('nimetsuCasinoToken');
  localStorage.removeItem('nimetsuCasinoUser');
  showToast('Sesión cerrada correctamente', 'success');
  
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
});

// Mostrar notificación
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast active ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// ==========================================
// ACCOUNT SIDEBAR FUNCTIONALITY
// ==========================================

// Abrir sidebar
accountBtn.addEventListener('click', () => {
  accountSidebar.classList.add('active');
  document.body.style.overflow = 'hidden';
});

// Cerrar sidebar
function closeAccountSidebar() {
  accountSidebar.classList.remove('active');
  document.body.style.overflow = 'auto';
}

closeSidebar.addEventListener('click', closeAccountSidebar);
sidebarOverlay.addEventListener('click', closeAccountSidebar);

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && accountSidebar.classList.contains('active')) {
    closeAccountSidebar();
  }
});

// Logout desde sidebar
logoutSidebarBtn.addEventListener('click', () => {
  localStorage.removeItem('nimetsuCasinoToken');
  localStorage.removeItem('nimetsuCasinoUser');
  showToast('Sesión cerrada correctamente', 'success');
  
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
});

// Account Options Handlers
depositBtn.addEventListener('click', () => {
  window.location.href = '/recharge';
});

withdrawBtn.addEventListener('click', () => {
  showToast('Función de retiro próximamente disponible', 'warning');
});

profileSettingsBtn.addEventListener('click', () => {
  showToast('Edición de perfil próximamente disponible', 'warning');
  closeAccountSidebar();
});

transactionHistoryBtn.addEventListener('click', () => {
  showToast('Historial de transacciones próximamente disponible', 'warning');
  closeAccountSidebar();
});

gameHistoryBtn.addEventListener('click', () => {
  loadGameHistory();
  closeAccountSidebar();
});

securityBtn.addEventListener('click', () => {
  showToast('Configuración de seguridad próximamente disponible', 'warning');
  closeAccountSidebar();
});

notificationsBtn.addEventListener('click', () => {
  showToast('Configuración de notificaciones próximamente disponible', 'warning');
  closeAccountSidebar();
});

// Refresh Balance Button
refreshBalanceBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('nimetsuCasinoToken');
  if (!token) return;
  
  // Agregar animación de carga
  refreshBalanceBtn.classList.add('loading');
  refreshBalanceBtn.disabled = true;
  
  await loadBalance(token);
  
  // Remover animación después de 1 segundo
  setTimeout(() => {
    refreshBalanceBtn.classList.remove('loading');
    refreshBalanceBtn.disabled = false;
    showToast('Saldo actualizado', 'success');
  }, 1000);
});

// ==========================================
// GAME HISTORY FUNCTIONALITY
// ==========================================

async function loadGameHistory() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) return;

    const res = await fetch('/user/game-history?limit=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Error al cargar historial');
    }

    const data = await res.json();
    displayGameHistory(data.games);
  } catch (err) {
    console.error('Error al cargar historial:', err);
    showToast('Error al cargar historial de juegos', 'error');
  }
}

function displayGameHistory(games) {
  if (!games || games.length === 0) {
    showToast('No tienes juegos registrados aún', 'warning');
    return;
  }

  // Crear modal de historial
  const modal = document.createElement('div');
  modal.className = 'history-modal active';
  modal.innerHTML = `
    <div class="history-modal-overlay"></div>
    <div class="history-modal-content">
      <div class="history-header">
        <h2><i class="fas fa-history"></i> Historial de Juegos</h2>
        <button class="btn-close-history"><i class="fas fa-times"></i></button>
      </div>
      <div class="history-stats">
        <div class="stat-summary">
          <div class="stat-icon">🎮</div>
          <div class="stat-text">
            <span class="stat-number">${games.length}</span>
            <span class="stat-label">Partidas</span>
          </div>
        </div>
        <div class="stat-summary">
          <div class="stat-icon">🏆</div>
          <div class="stat-text">
            <span class="stat-number">${games.filter(g => g.result === 'win').length}</span>
            <span class="stat-label">Victorias</span>
          </div>
        </div>
        <div class="stat-summary">
          <div class="stat-icon">❌</div>
          <div class="stat-text">
            <span class="stat-number">${games.filter(g => g.result === 'loss').length}</span>
            <span class="stat-label">Derrotas</span>
          </div>
        </div>
        <div class="stat-summary">
          <div class="stat-icon">💰</div>
          <div class="stat-text">
            <span class="stat-number ${getTotalProfit(games) >= 0 ? 'positive' : 'negative'}">
              ${getTotalProfit(games) >= 0 ? '+' : ''}$${Math.abs(getTotalProfit(games)).toFixed(2)}
            </span>
            <span class="stat-label">Balance Total</span>
          </div>
        </div>
      </div>
      <div class="history-list">
        ${games.map(game => {
          const profit = parseFloat(game.winAmount) - parseFloat(game.betAmount);
          const gameDataObj = typeof game.gameData === 'string' ? JSON.parse(game.gameData) : game.gameData;
          
          return `
            <div class="history-item ${game.result}">
              <div class="history-game-icon">${getGameIcon(game.gameType)}</div>
              <div class="history-details">
                <div class="history-game-header">
                  <span class="history-game-type">${getGameName(game.gameType)}</span>
                  <span class="history-result-badge ${game.result}">
                    ${game.result === 'win' ? '🏆 Victoria' : game.result === 'tie' ? '🤝 Empate' : '❌ Derrota'}
                  </span>
                </div>
                <div class="history-game-info">
                  ${getGameDetails(game.gameType, gameDataObj)}
                </div>
                <div class="history-date">
                  <i class="fas fa-clock"></i> ${formatDate(game.createdAt)}
                </div>
              </div>
              <div class="history-amounts">
                <div class="history-bet-amount">
                  <span class="label">Apuesta:</span>
                  <span class="amount">$${parseFloat(game.betAmount).toFixed(2)}</span>
                </div>
                <div class="history-win-amount">
                  <span class="label">Ganancia:</span>
                  <span class="amount">$${parseFloat(game.winAmount).toFixed(2)}</span>
                </div>
                <div class="history-profit ${profit >= 0 ? 'positive' : 'negative'}">
                  <span class="label">Neto:</span>
                  <span class="amount">${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Cerrar modal
  const closeBtn = modal.querySelector('.btn-close-history');
  const overlay = modal.querySelector('.history-modal-overlay');

  function closeHistory() {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  closeBtn.addEventListener('click', closeHistory);
  overlay.addEventListener('click', closeHistory);
  
  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeHistory();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

function getTotalProfit(games) {
  return games.reduce((total, game) => {
    return total + (parseFloat(game.winAmount) - parseFloat(game.betAmount));
  }, 0);
}

function getGameDetails(gameType, gameData) {
  if (!gameData) return '<span class="game-detail">Sin datos adicionales</span>';
  
  switch(gameType) {
    case 'roulette':
      const wheelNum = gameData.wheelNumber !== undefined ? gameData.wheelNumber : 'N/A';
      const wheelColor = gameData.wheelColor || 'N/A';
      const numBets = gameData.bets ? gameData.bets.length : 0;
      const winningBets = gameData.winningBets ? gameData.winningBets.length : 0;
      return `
        <span class="game-detail"><i class="fas fa-bullseye"></i> Número: <strong>${wheelNum}</strong> (${wheelColor})</span>
        <span class="game-detail"><i class="fas fa-coins"></i> Apuestas: ${numBets} (${winningBets} ganadoras)</span>
      `;
    
    case 'blackjack':
      const playerValue = gameData.playerValue || 'N/A';
      const dealerValue = gameData.dealerValue || 'N/A';
      const resultMsg = gameData.resultMessage || '';
      const playerCards = gameData.playerHand ? gameData.playerHand.length : 0;
      const dealerCards = gameData.dealerHand ? gameData.dealerHand.length : 0;
      return `
        <span class="game-detail"><i class="fas fa-hand-holding"></i> Jugador: <strong>${playerValue}</strong> (${playerCards} cartas)</span>
        <span class="game-detail"><i class="fas fa-user-tie"></i> Dealer: <strong>${dealerValue}</strong> (${dealerCards} cartas)</span>
        ${resultMsg ? `<span class="game-detail"><i class="fas fa-info-circle"></i> ${resultMsg}</span>` : ''}
      `;
    
    case 'slots':
      const reels = gameData.reels || gameData.symbols;
      const multiplier = gameData.multiplier || 0;
      let symbolsDisplay = '';
      if (reels) {
        if (Array.isArray(reels)) {
          symbolsDisplay = reels.join(' ');
        } else {
          symbolsDisplay = `${reels.reel1 || ''} ${reels.reel2 || ''} ${reels.reel3 || ''}`;
        }
      }
      return `
        <span class="game-detail"><i class="fas fa-grip-horizontal"></i> Símbolos: <strong>${symbolsDisplay || 'N/A'}</strong></span>
        ${multiplier > 0 ? `<span class="game-detail"><i class="fas fa-times"></i> Multiplicador: <strong>${multiplier}x</strong></span>` : ''}
      `;
    
    case 'poker':
      const playerHandType = gameData.playerHandType || 'N/A';
      const dealerHandType = gameData.dealerHandType || 'N/A';
      const anteBonus = gameData.anteBonus || 0;
      const dealerQualifies = gameData.dealerQualifies;
      const pokerResult = gameData.resultMessage || '';
      return `
        <span class="game-detail"><i class="fas fa-hand-holding"></i> Tu mano: <strong>${playerHandType}</strong></span>
        <span class="game-detail"><i class="fas fa-user-tie"></i> Dealer: <strong>${dealerHandType}</strong></span>
        ${dealerQualifies !== undefined ? `<span class="game-detail"><i class="fas fa-check-circle"></i> Dealer ${dealerQualifies ? 'califica' : 'no califica'}</span>` : ''}
        ${anteBonus > 0 ? `<span class="game-detail"><i class="fas fa-gift"></i> Bonus: $${anteBonus.toFixed(2)}</span>` : ''}
        ${pokerResult ? `<span class="game-detail"><i class="fas fa-info-circle"></i> ${pokerResult}</span>` : ''}
      `;
    
    default:
      return `<span class="game-detail"><i class="fas fa-gamepad"></i> Partida registrada</span>`;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Si fue hace menos de 24 horas, mostrar tiempo relativo
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `Hace ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Hace ${minutes} minutos`;
    } else {
      return 'Hace un momento';
    }
  }
  
  // Si fue hace más de 24 horas, mostrar fecha
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getGameIcon(gameType) {
  const icons = {
    roulette: '🎡',
    blackjack: '🃏',
    slots: '🎰',
    poker: '♠️',
    craps: '🎲',
    baccarat: '💎'
  };
  return icons[gameType] || '🎮';
}

function getGameName(gameType) {
  const names = {
    roulette: 'Ruleta',
    blackjack: 'Blackjack',
    slots: 'Tragamonedas',
    poker: 'Poker',
    craps: 'Dados',
    baccarat: 'Baccarat'
  };
  return names[gameType] || gameType;
}

// ==========================================
// RECHARGE BALANCE FUNCTIONALITY
// ==========================================

async function loadRechargeModal() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) return;

    // Obtener paquetes disponibles
    const res = await fetch('/payment/packages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Error al cargar paquetes');
    }

    const data = await res.json();
    displayRechargeModal(data.packages);
  } catch (err) {
    console.error('Error al cargar paquetes:', err);
    showToast('Error al cargar opciones de recarga', 'error');
  }
}

function displayRechargeModal(packages) {
  const modal = document.createElement('div');
  modal.className = 'recharge-modal active';
  modal.innerHTML = `
    <div class="recharge-modal-overlay"></div>
    <div class="recharge-modal-content">
      <div class="recharge-header">
        <h2><i class="fas fa-wallet"></i> Recargar Saldo</h2>
        <button class="btn-close-recharge">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="recharge-packages">
        ${Object.entries(packages).map(([id, pkg]) => {
          const totalFichas = pkg.amount + pkg.bonus;
          const bonusPercent = pkg.bonus > 0 ? Math.round((pkg.bonus / pkg.amount) * 100) : 0;
          
          return `
            <div class="package-card ${pkg.bonus > 0 ? 'has-bonus' : ''}" data-package-id="${id}">
              ${pkg.bonus > 0 ? `<div class="package-badge">+${bonusPercent}% BONUS</div>` : ''}
              <div class="package-title">${pkg.title}</div>
              <div class="package-amount">
                <span class="amount-value">${totalFichas.toLocaleString('es-CL')}</span>
                <span class="amount-label">fichas</span>
              </div>
              ${pkg.bonus > 0 ? `
                <div class="package-breakdown">
                  <div class="breakdown-item">
                    <span class="breakdown-label">Base:</span>
                    <span class="breakdown-value">${pkg.amount.toLocaleString('es-CL')}</span>
                  </div>
                  <div class="breakdown-item bonus">
                    <span class="breakdown-label">Bonus:</span>
                    <span class="breakdown-value">+${pkg.bonus.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              ` : ''}
              <div class="package-price">$${pkg.price.toLocaleString('es-CL')} CLP</div>
              <button class="btn-buy-package" data-package-id="${id}">
                <i class="fas fa-shopping-cart"></i> Comprar
              </button>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="recharge-note">
        <i class="fas fa-shield-alt"></i>
        Pago seguro procesado por MercadoPago
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event Listeners
  const overlay = modal.querySelector('.recharge-modal-overlay');
  const closeBtn = modal.querySelector('.btn-close-recharge');
  const buyButtons = modal.querySelectorAll('.btn-buy-package');

  function closeRecharge() {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  overlay.addEventListener('click', closeRecharge);
  closeBtn.addEventListener('click', closeRecharge);

  buyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const packageId = btn.dataset.packageId;
      initiateRecharge(packageId);
    });
  });

  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeRecharge();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

async function initiateRecharge(packageId) {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) {
      showToast('Debes iniciar sesión', 'error');
      return;
    }

    showToast('Generando enlace de pago...', 'info');

    const res = await fetch('/payment/create-recharge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageId })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error al crear preferencia de pago');
    }

    // Redirigir a MercadoPago
    window.location.href = data.init_point;
  } catch (err) {
    console.error('Error al iniciar recarga:', err);
    showToast('Error al procesar la recarga', 'error');
  }
}

