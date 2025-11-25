
const customAmountInput = document.getElementById('customAmount');
const fichasReceivedEl = document.getElementById('fichasReceived');
const btnDepositCustom = document.getElementById('btnDepositCustom');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const balanceAmountEl = document.getElementById('balanceAmount');
const userNameEl = document.getElementById('userName');
const accountBtn = document.getElementById('accountBtn');
const toast = document.getElementById('toast');
const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
const bonusPackagesEl = document.getElementById('bonusPackages');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');


const btnWithdrawBank = document.getElementById('btnWithdrawBank');
const withdrawBankAmount = document.getElementById('withdrawBankAmount');
const bankSelect = document.getElementById('bankSelect');
const rutInput = document.getElementById('rutInput');
const accountTypeSelect = document.getElementById('accountTypeSelect');
const accountNumberInput = document.getElementById('accountNumberInput');

const cryptoOptions = document.querySelectorAll('.crypto-option');
const btnWithdrawCrypto = document.getElementById('btnWithdrawCrypto');
const withdrawCryptoAmount = document.getElementById('withdrawCryptoAmount');
const walletAddress = document.getElementById('walletAddress');
const cryptoEquivalent = document.getElementById('cryptoEquivalent');
const cryptoSymbol = document.getElementById('cryptoSymbol');

let selectedCrypto = 'btc';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('nimetsuCasinoToken');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  loadUserData();
  loadBonusPackages();
  loadTransactionHistory();
  
  setInterval(loadBalance, 30000);

  setTimeout(() => {
    const hash = window.location.hash;
  
    
    if (hash === '#withdraw') {

      const withdrawBtn = document.querySelector('[data-section="withdraw-bank"]');
      if (withdrawBtn) {
        withdrawBtn.click();
      
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {

      }
    } else if (hash === '#history') {
      const historyBtn = document.querySelector('[data-section="history"]');
      if (historyBtn) {
        historyBtn.click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, 100);
});

async function loadUserData() {
  const token = localStorage.getItem('nimetsuCasinoToken');
  const user = JSON.parse(localStorage.getItem('nimetsuCasinoUser') || '{}');
  
  if (user.nickname) {
    userNameEl.textContent = user.nickname;
  }

  await loadBalance();
}

async function loadBalance() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const res = await fetch('/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      balanceAmountEl.textContent = `$${data.balance.toLocaleString('es-CL')}`;
    }
  } catch (err) {
  }
}

refreshBalanceBtn.addEventListener('click', async () => {
  refreshBalanceBtn.classList.add('loading');
  await loadBalance();
  setTimeout(() => {
    refreshBalanceBtn.classList.remove('loading');
    showToast('Saldo actualizado', 'success');
  }, 500);
});

accountBtn.addEventListener('click', () => {
  window.location.href = '/dashboard';
});

sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    
    sidebarItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    updatePageHeader(section);
  });
});

function updatePageHeader(section) {
  const headers = {
    'deposit': {
      title: '<i class="fas fa-plus-circle"></i> Depositar Fondos',
      description: 'Recarga tu saldo de forma rápida y segura con MercadoPago'
    },
    'withdraw-bank': {
      title: '<i class="fas fa-university"></i> Retiro Bancario',
      description: 'Transfiere tu saldo a tu cuenta bancaria en Chile'
    },
    'withdraw-crypto': {
      title: '<i class="fab fa-bitcoin"></i> Retiro en Criptomonedas',
      description: 'Retira tu saldo en Bitcoin o USDT de forma segura'
    },
    'history': {
      title: '<i class="fas fa-history"></i> Historial de Transacciones',
      description: 'Revisa todas tus transacciones de depósitos y retiros'
    }
  };
  
  pageTitle.innerHTML = headers[section].title;
  pageDescription.textContent = headers[section].description;
}

customAmountInput.addEventListener('input', () => {
  const amount = parseInt(customAmountInput.value) || 0;
  fichasReceivedEl.textContent = amount.toLocaleString('es-CL');
  
  btnDepositCustom.disabled = amount < 500;
});

btnDepositCustom.addEventListener('click', async () => {
  const amount = parseInt(customAmountInput.value);
  
  if (amount < 500) {
    showToast('El monto mínimo es $500 CLP', 'error');
    return;
  }

  await initiateCustomDeposit(amount);
});

quickAmountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.dataset.amount);
    customAmountInput.value = amount;
    fichasReceivedEl.textContent = amount.toLocaleString('es-CL');
    btnDepositCustom.disabled = false;
  });
});

async function loadBonusPackages() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) return;

    const res = await fetch('/payment/packages', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error loading packages');

    const data = await res.json();
    displayBonusPackages(data.packages);
  } catch (err) {
    console.error('Error loading packages:', err);
  }
}

function displayBonusPackages(packages) {
  const bonusPackages = Object.entries(packages).filter(([id, pkg]) => pkg.bonus > 0);
  
  bonusPackagesEl.innerHTML = bonusPackages.map(([id, pkg]) => {
    const totalFichas = pkg.amount + pkg.bonus;
    const bonusPercent = Math.round((pkg.bonus / pkg.amount) * 100);
    
    return `
      <div class="package-card">
        <div class="package-badge">+${bonusPercent}% BONUS</div>
        <div class="package-title">${pkg.title}</div>
        <div class="package-amount">${totalFichas.toLocaleString('es-CL')}</div>
        <div class="package-breakdown">
          Base: ${pkg.amount.toLocaleString('es-CL')} + Bonus: ${pkg.bonus.toLocaleString('es-CL')}
        </div>
        <div class="package-price">$${pkg.price.toLocaleString('es-CL')} CLP</div>
        <button class="btn-buy-package" data-package-id="${id}">
          <i class="fas fa-shopping-cart"></i> Comprar
        </button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-buy-package').forEach(btn => {
    btn.addEventListener('click', () => {
      const packageId = btn.dataset.packageId;
      initiatePackagePurchase(packageId);
    });
  });
}

async function initiateCustomDeposit(amount) {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) {
      showToast('Debes iniciar sesión', 'error');
      return;
    }

    showToast('Generando enlace de pago...', 'info');

    const res = await fetch('/payment/create-custom-recharge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error al crear preferencia de pago');
    }

    window.location.href = data.init_point;
  } catch (err) {
    showToast('Error al procesar el depósito', 'error');
  }
}

async function initiatePackagePurchase(packageId) {
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

    window.location.href = data.init_point;
  } catch (err) {
  
    showToast('Error al procesar la compra', 'error');
  }
}

function validateBankForm() {
  const isValid = bankSelect.value && 
                  rutInput.value && 
                  accountTypeSelect.value && 
                  accountNumberInput.value && 
                  withdrawBankAmount.value >= 5000;
  
  btnWithdrawBank.disabled = !isValid;
}

bankSelect.addEventListener('change', validateBankForm);
rutInput.addEventListener('input', validateBankForm);
accountTypeSelect.addEventListener('change', validateBankForm);
accountNumberInput.addEventListener('input', validateBankForm);
withdrawBankAmount.addEventListener('input', validateBankForm);

btnWithdrawBank.addEventListener('click', async () => {
  const amount = parseInt(withdrawBankAmount.value);
  
  if (amount < 5000) {
    showToast('El monto mínimo para retiro bancario es $5,000 CLP', 'error');
    return;
  }

  if (!bankSelect.value) {
    showToast('Selecciona un banco', 'error');
    return;
  }

  if (!accountTypeSelect.value) {
    showToast('Selecciona el tipo de cuenta', 'error');
    return;
  }

  if (!accountNumberInput.value) {
    showToast('Ingresa el número de cuenta', 'error');
    return;
  }

  if (!rutInput.value) {
    showToast('Ingresa tu RUT', 'error');
    return;
  }

  if (!confirm(`¿Confirmas el retiro de $${amount.toLocaleString('es-CL')} CLP a ${bankSelect.value}?`)) {
    return;
  }

  try {
    btnWithdrawBank.disabled = true;
    btnWithdrawBank.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    const token = localStorage.getItem('nimetsuCasinoToken');
    
    const requestData = {
      amount,
      bankName: bankSelect.value,
      accountType: accountTypeSelect.value,
      accountNumber: accountNumberInput.value,
      accountRut: rutInput.value,
      saveMethod: false
    };


    const res = await fetch('/withdraw/bank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });


    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();

      throw new Error('El servidor no devolvió una respuesta JSON válida. Puede ser un error 404 o 500.');
    }

    const data = await res.json();

    if (data.success) {
      showToast('Solicitud de retiro creada exitosamente', 'success');
   
      withdrawBankAmount.value = '';
      accountNumberInput.value = '';
      rutInput.value = '';
      bankSelect.value = '';
      accountTypeSelect.value = '';
      
      setTimeout(async () => {
      
        await loadBalance();
        await loadTransactionHistory();
      
        const historyBtn = document.querySelector('[data-section="history"]');
        if (historyBtn) {
          historyBtn.click();
        }
      }, 500);
    } else {
      showToast(data.message || 'Error al procesar retiro', 'error');
    }
  } catch (err) {
    showToast('Error al procesar retiro: ' + err.message, 'error');
  } finally {
    btnWithdrawBank.disabled = false;
    btnWithdrawBank.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Retiro Bancario';
  }
});

cryptoOptions.forEach(option => {
  option.addEventListener('click', () => {
    cryptoOptions.forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selectedCrypto = option.dataset.crypto;
    cryptoSymbol.textContent = selectedCrypto.toUpperCase();
    updateCryptoConversion();
  });
});

function validateCryptoForm() {
  const isValid = walletAddress.value.length > 20 && 
                  withdrawCryptoAmount.value >= 10000;
  
  btnWithdrawCrypto.disabled = !isValid;
}

walletAddress.addEventListener('input', validateCryptoForm);
withdrawCryptoAmount.addEventListener('input', () => {
  validateCryptoForm();
  updateCryptoConversion();
});

function updateCryptoConversion() {
  const amount = parseInt(withdrawCryptoAmount.value) || 0;
  const rates = {
    btc: 0.000000012350276, 
    usdt: 0.0011  
  };
  
  const converted = (amount * rates[selectedCrypto]).toFixed(selectedCrypto === 'btc' ? 8 : 2);
  cryptoEquivalent.textContent = converted;
}

btnWithdrawCrypto.addEventListener('click', async () => {
  const amount = parseInt(withdrawCryptoAmount.value);
  
  if (amount < 10000) {
    showToast('El monto mínimo para retiro crypto es $10,000 fichas', 'error');
    return;
  }
  
  if (!walletAddress.value || walletAddress.value.length < 20) {
    showToast('Ingresa una dirección de wallet válida', 'error');
    return;
  }

  if (!confirm(`¿Confirmas el retiro de ${amount.toLocaleString('es-CL')} fichas a tu wallet ${selectedCrypto.toUpperCase()}?`)) {
    return;
  }

  try {
    btnWithdrawCrypto.disabled = true;
    btnWithdrawCrypto.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    const token = localStorage.getItem('nimetsuCasinoToken');
    const res = await fetch('/withdraw/crypto', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        cryptoType: selectedCrypto,
        walletAddress: walletAddress.value,
        saveMethod: false
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Solicitud de retiro creada. Recibirás ${data.cryptoAmount} ${selectedCrypto.toUpperCase()}`, 'success');
     
      withdrawCryptoAmount.value = '';
      walletAddress.value = '';
      
      setTimeout(async () => {
        
        await loadBalance();
        await loadTransactionHistory();
      
        const historyBtn = document.querySelector('[data-section="history"]');
        if (historyBtn) {
          historyBtn.click();
        }
      }, 500);
    } else {
      showToast(data.message || 'Error al procesar retiro', 'error');
    }
  } catch (err) {
    showToast('Error al procesar retiro', 'error');
  } finally {
    btnWithdrawCrypto.disabled = false;
    btnWithdrawCrypto.innerHTML = '<i class="fas fa-lock"></i> Solicitar Retiro en Crypto';
  }
});

async function loadTransactionHistory() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) {
      return;
    }

    const res = await fetch('/withdraw/history?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();

      throw new Error('Error loading history');
    }

    const data = await res.json();
  
    displayTransactionHistory(data.transactions);
  } catch (err) {
    
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
      transactionsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error al cargar el historial</p>
        </div>
      `;
    }
  }
}

function displayTransactionHistory(transactions) {
  const transactionsList = document.getElementById('transactionsList');
  
  if (!transactions || transactions.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No hay transacciones aún</p>
      </div>
    `;
    return;
  }

  transactionsList.innerHTML = transactions.map(tx => {
    const statusColors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#64748b'
    };

    const statusIcons = {
      pending: 'fa-clock',
      processing: 'fa-spinner fa-spin',
      completed: 'fa-check-circle',
      approved: 'fa-check-circle',
      rejected: 'fa-times-circle',
      cancelled: 'fa-ban'
    };

    const statusLabels = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      cancelled: 'Cancelado'
    };

    const typeInfo = tx.type === 'deposit' 
      ? { icon: 'fa-arrow-down', text: 'Depósito', color: '#10b981' }
      : { icon: 'fa-arrow-up', text: 'Retiro', color: '#ef4444' };

    const methodText = {
      'mercadopago': 'MercadoPago',
      'bank_transfer': 'Transferencia Bancaria',
      'crypto_btc': 'Bitcoin',
      'crypto_usdt': 'USDT'
    };

    const date = new Date(tx.createdAt).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="transaction-item" style="border-left: 4px solid ${typeInfo.color}">
        <div class="transaction-header">
          <div class="transaction-type" style="color: ${typeInfo.color}">
            <i class="fas ${typeInfo.icon}"></i>
            <span>${typeInfo.text}</span>
          </div>
          <div class="transaction-status" style="background: ${statusColors[tx.status]}20; color: ${statusColors[tx.status]}; border: 1px solid ${statusColors[tx.status]}40;">
            <i class="fas ${statusIcons[tx.status]}"></i>
            <span>${statusLabels[tx.status] || tx.status}</span>
          </div>
        </div>
        <div class="transaction-body">
          <div class="transaction-info">
            <span class="transaction-method">${methodText[tx.method] || tx.method}</span>
            ${tx.bank_name ? `<span class="transaction-detail"><i class="fas fa-university"></i> ${tx.bank_name}</span>` : ''}
            ${tx.account_type ? `<span class="transaction-detail"><i class="fas fa-id-card"></i> Cuenta ${tx.account_type}</span>` : ''}
            ${tx.crypto_type ? `<span class="transaction-detail"><i class="fab fa-bitcoin"></i> ${tx.crypto_type.toUpperCase()}</span>` : ''}
            ${tx.payment_id ? `<span class="transaction-detail"><i class="fas fa-hashtag"></i> ${tx.payment_id}</span>` : ''}
          </div>
          <div class="transaction-amount" style="color: ${typeInfo.color}">
            ${tx.type === 'deposit' ? '+' : '-'}$${(tx.amount || 0).toLocaleString('es-CL')}
          </div>
        </div>
        <div class="transaction-footer">
          <span class="transaction-date">${date}</span>
          <span class="transaction-fichas">${(tx.fichas || 0).toLocaleString('es-CL')} fichas</span>
        </div>
      </div>
    `;
  }).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const filter = btn.dataset.filter;
    
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    try {
      const token = localStorage.getItem('nimetsuCasinoToken');
      let url = '/withdraw/history?limit=20';
      
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      displayTransactionHistory(data.transactions);
    } catch (err) {

    }
  });
});

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) {
    return;
  }
  let iconClass = 'fas fa-check-circle';
  let backgroundColor = 'rgba(16, 185, 129, 0.95)';
  let borderColor = '#10b981';
  
  if (type === 'error') {
    iconClass = 'fas fa-times-circle';
    backgroundColor = 'rgba(239, 68, 68, 0.95)';
    borderColor = '#ef4444';
  } else if (type === 'warning') {
    iconClass = 'fas fa-exclamation-triangle';
    backgroundColor = 'rgba(245, 158, 11, 0.95)';
    borderColor = '#f59e0b';
  } else if (type === 'info') {
    iconClass = 'fas fa-info-circle';
    backgroundColor = 'rgba(59, 130, 246, 0.95)';
    borderColor = '#3b82f6';
  }
  
  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;
  
  toast.style.background = backgroundColor;
  toast.style.borderLeft = `4px solid ${borderColor}`;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
