// public/js/game.js

const backBtn = document.getElementById('backBtn');
const playBtn = document.getElementById('playBtn');
const clearBtn = document.getElementById('clearBtn');
const betAmountInput = document.getElementById('betAmount');
const quickBets = document.querySelectorAll('.quick-bet');
const toast = document.getElementById('toast');
const balanceEl = document.getElementById('balance');

document.addEventListener('DOMContentLoaded', () => {
  loadBalance();
});

async function loadBalance() {
  const token = localStorage.getItem('nimetsuCasinoToken');
  try {
    
    const res = await fetch('/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return;
    }

    const data = await res.json();
  
  } catch (err) {
  
  }
}

backBtn.addEventListener('click', () => {
  window.location.href = '/dashboard';
});

quickBets.forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.getAttribute('data-amount'));
    betAmountInput.value = amount;
  });
});

clearBtn.addEventListener('click', () => {
  betAmountInput.value = minBet;
  showToast('Apuesta limpida', 'success');
});

playBtn.addEventListener('click', () => {
  const bet = parseInt(betAmountInput.value);

  if (isNaN(bet) || bet < minBet) {
    showToast(`La apuesta mínima es $${minBet}`, 'error');
    return;
  }

  if (bet > maxBet) {
    showToast(`La apuesta máxima es $${maxBet}`, 'error');
    return;
  }

  playBtn.disabled = true;
  playBtn.textContent = 'Jugando...';

  setTimeout(() => {
   
    const random = Math.random();
    let result, winAmount, resultType;

    if (random > 0.5) {
    
      winAmount = Math.floor(bet * (1 + Math.random() * 2));
      resultType = 'success';
      result = `¡Ganaste $${winAmount}!`;
    } else {
     
      winAmount = bet;
      resultType = 'error';
      result = `¡Perdiste $${winAmount}!`;
    }

    playBtn.disabled = false;
    playBtn.textContent = 'JUGAR';

    showToast(result, resultType);

  }, 2000);
});

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast active ${type}`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

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
