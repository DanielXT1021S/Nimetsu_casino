// public/js/game.js

const backBtn = document.getElementById('backBtn');
const playBtn = document.getElementById('playBtn');
const clearBtn = document.getElementById('clearBtn');
const betAmountInput = document.getElementById('betAmount');
const quickBets = document.querySelectorAll('.quick-bet');
const toast = document.getElementById('toast');
const balanceEl = document.getElementById('balance');

// Cargar balance al iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadBalance();
});

// Cargar balance
async function loadBalance() {
  const token = localStorage.getItem('nimetsuCasinoToken');
  try {
    console.log('Token enviado desde game.js:', token);
    
    const res = await fetch('/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error al cargar balance:', errorData);
      return;
    }

    const data = await res.json();
    console.log('Balance data:', data);
    // Aquí puedes actualizar el balance real
    // balanceEl.textContent = `$${data.balance.toFixed(2)}`;
  } catch (err) {
    console.error('Error al cargar balance:', err);
  }
}

// Botón atrás
backBtn.addEventListener('click', () => {
  window.location.href = '/dashboard';
});

// Botones de apuestas rápidas
quickBets.forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.getAttribute('data-amount'));
    betAmountInput.value = amount;
  });
});

// Limpiar apuesta
clearBtn.addEventListener('click', () => {
  betAmountInput.value = minBet;
  showToast('Apuesta limpida', 'success');
});

// Jugar
playBtn.addEventListener('click', () => {
  const bet = parseInt(betAmountInput.value);

  // Validar apuesta
  if (isNaN(bet) || bet < minBet) {
    showToast(`La apuesta mínima es $${minBet}`, 'error');
    return;
  }

  if (bet > maxBet) {
    showToast(`La apuesta máxima es $${maxBet}`, 'error');
    return;
  }

  // Simular juego
  playBtn.disabled = true;
  playBtn.textContent = 'Jugando...';

  setTimeout(() => {
    // Simulación de resultado
    const random = Math.random();
    let result, winAmount, resultType;

    if (random > 0.5) {
      // Ganan
      winAmount = Math.floor(bet * (1 + Math.random() * 2));
      resultType = 'success';
      result = `¡Ganaste $${winAmount}!`;
    } else {
      // Pierden
      winAmount = bet;
      resultType = 'error';
      result = `¡Perdiste $${winAmount}!`;
    }

    playBtn.disabled = false;
    playBtn.textContent = 'JUGAR';

    showToast(result, resultType);

    // Aquí enviarías la información del juego al servidor
    // recordGame(gameId, bet, resultType === 'success', winAmount);
  }, 2000);
});

// Mostrar notificación
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast active ${type}`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Validar input de apuesta
betAmountInput.addEventListener('change', (e) => {
  let value = parseInt(e.target.value);

  if (value < minBet) {
    e.target.value = minBet;
    showToast(`Apuesta mínima: $${minBet}`, 'error');
  } else if (value > maxBet) {
    e.target.value = maxBet;
    showToast(`Apuesta máxima: $${maxBet}`, 'error');
  }
});
