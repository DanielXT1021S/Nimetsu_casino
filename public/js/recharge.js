// Elements
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

// Withdraw elements
const btnWithdrawBank = document.getElementById('btnWithdrawBank');
const withdrawBankAmount = document.getElementById('withdrawBankAmount');
const bankSelect = document.getElementById('bankSelect');
const rutInput = document.getElementById('rutInput');
const accountTypeSelect = document.getElementById('accountTypeSelect');
const accountNumberInput = document.getElementById('accountNumberInput');

// Crypto elements
const cryptoOptions = document.querySelectorAll('.crypto-option');
const btnWithdrawCrypto = document.getElementById('btnWithdrawCrypto');
const withdrawCryptoAmount = document.getElementById('withdrawCryptoAmount');
const walletAddress = document.getElementById('walletAddress');
const cryptoEquivalent = document.getElementById('cryptoEquivalent');
const cryptoSymbol = document.getElementById('cryptoSymbol');

let selectedCrypto = 'btc';

// Load user data
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  loadBonusPackages();
  loadTransactionHistory();
  
  // Auto-refresh balance every 30 seconds
  setInterval(loadBalance, 30000);
});

// Load user data
async function loadUserData() {
  const token = localStorage.getItem('nimetsuCasinoToken');
  const user = JSON.parse(localStorage.getItem('nimetsuCasinoUser') || '{}');
  
  if (user.nickname) {
    userNameEl.textContent = user.nickname;
  }

  await loadBalance();
}

// Load balance
async function loadBalance() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) return;

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
    console.error('Error loading balance:', err);
  }
}

// Refresh balance button
refreshBalanceBtn.addEventListener('click', async () => {
  refreshBalanceBtn.classList.add('loading');
  await loadBalance();
  setTimeout(() => {
    refreshBalanceBtn.classList.remove('loading');
    showToast('Saldo actualizado', 'success');
  }, 500);
});

// Account button
accountBtn.addEventListener('click', () => {
  window.location.href = '/dashboard';
});

// Sidebar navigation
sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    
    // Update active sidebar item
    sidebarItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Update active content section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update page title and description
    updatePageHeader(section);
  });
});

// Update page header based on section
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

// Custom amount input
customAmountInput.addEventListener('input', () => {
  const amount = parseInt(customAmountInput.value) || 0;
  fichasReceivedEl.textContent = amount.toLocaleString('es-CL');
  
  // Enable/disable button
  btnDepositCustom.disabled = amount < 500;
});

// Deposit custom amount
btnDepositCustom.addEventListener('click', async () => {
  const amount = parseInt(customAmountInput.value);
  
  if (amount < 500) {
    showToast('El monto mínimo es $500 CLP', 'error');
    return;
  }

  await initiateCustomDeposit(amount);
});

// Quick amount buttons
quickAmountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const amount = parseInt(btn.dataset.amount);
    customAmountInput.value = amount;
    fichasReceivedEl.textContent = amount.toLocaleString('es-CL');
    btnDepositCustom.disabled = false;
  });
});

// Load bonus packages
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

// Display bonus packages
function displayBonusPackages(packages) {
  // Filter only packages with bonus
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

  // Add event listeners to buy buttons
  document.querySelectorAll('.btn-buy-package').forEach(btn => {
    btn.addEventListener('click', () => {
      const packageId = btn.dataset.packageId;
      initiatePackagePurchase(packageId);
    });
  });
}

// Initiate custom deposit
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

    // Redirect to MercadoPago
    window.location.href = data.init_point;
  } catch (err) {
    console.error('Error initiating deposit:', err);
    showToast('Error al procesar el depósito', 'error');
  }
}

// Initiate package purchase
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

    // Redirect to MercadoPago
    window.location.href = data.init_point;
  } catch (err) {
    console.error('Error initiating purchase:', err);
    showToast('Error al procesar la compra', 'error');
  }
}

// Bank withdrawal validation
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

// Bank withdraw button
btnWithdrawBank.addEventListener('click', async () => {
  const amount = parseInt(withdrawBankAmount.value);
  
  console.log('[FRONTEND] Iniciando retiro bancario:', {
    amount,
    bankName: bankSelect.value,
    accountType: accountTypeSelect.value,
    accountNumber: accountNumberInput.value,
    accountRut: rutInput.value
  });
  
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

    console.log('[FRONTEND] Enviando solicitud:', requestData);

    const res = await fetch('/withdraw/bank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('[FRONTEND] Respuesta HTTP:', res.status);
    console.log('[FRONTEND] Content-Type:', res.headers.get('content-type'));

    // Verificar si la respuesta es JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('[FRONTEND] Respuesta no es JSON:', text);
      throw new Error('El servidor no devolvió una respuesta JSON válida. Puede ser un error 404 o 500.');
    }

    const data = await res.json();
    console.log('[FRONTEND] Respuesta data:', data);

    if (data.success) {
      showToast('Solicitud de retiro creada exitosamente', 'success');
      
      // Limpiar formulario
      withdrawBankAmount.value = '';
      accountNumberInput.value = '';
      rutInput.value = '';
      bankSelect.value = '';
      accountTypeSelect.value = '';
      
      // Recargar balance e historial
      await loadBalance();
      await loadTransactionHistory();
      
      // Cambiar a historial
      setTimeout(() => {
        document.querySelector('[data-section="history"]').click();
      }, 500);
    } else {
      showToast(data.message || 'Error al procesar retiro', 'error');
    }
  } catch (err) {
    console.error('[FRONTEND] Error:', err);
    showToast('Error al procesar retiro: ' + err.message, 'error');
  } finally {
    btnWithdrawBank.disabled = false;
    btnWithdrawBank.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Retiro Bancario';
  }
});

// Crypto option selection
cryptoOptions.forEach(option => {
  option.addEventListener('click', () => {
    cryptoOptions.forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selectedCrypto = option.dataset.crypto;
    cryptoSymbol.textContent = selectedCrypto.toUpperCase();
    updateCryptoConversion();
  });
});

// Crypto withdrawal validation
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

// Update crypto conversion (mock rates)
function updateCryptoConversion() {
  const amount = parseInt(withdrawCryptoAmount.value) || 0;
  const rates = {
    btc: 0.000000012350276, // 1 CLP ≈ 0.0000115 BTC (example)
    usdt: 0.0011    // 1 CLP ≈ 0.00112 USDT (example)
  };
  
  const converted = (amount * rates[selectedCrypto]).toFixed(selectedCrypto === 'btc' ? 8 : 2);
  cryptoEquivalent.textContent = converted;
}

// Crypto withdraw button
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
      
      // Limpiar formulario
      withdrawCryptoAmount.value = '';
      walletAddress.value = '';
      
      // Recargar balance e historial
      await loadBalance();
      await loadTransactionHistory();
      
      // Cambiar a historial
      document.querySelector('[data-section="history"]').click();
    } else {
      showToast(data.message || 'Error al procesar retiro', 'error');
    }
  } catch (err) {
    console.error('Error:', err);
    showToast('Error al procesar retiro', 'error');
  } finally {
    btnWithdrawCrypto.disabled = false;
    btnWithdrawCrypto.innerHTML = '<i class="fas fa-lock"></i> Solicitar Retiro en Crypto';
  }
});

// Load transaction history
async function loadTransactionHistory() {
  try {
    const token = localStorage.getItem('nimetsuCasinoToken');
    if (!token) return;

    const res = await fetch('/withdraw/history?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error loading history');

    const data = await res.json();
    displayTransactionHistory(data.transactions);
  } catch (err) {
    console.error('Error loading history:', err);
  }
}

// Display transaction history
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
      rejected: '#ef4444',
      cancelled: '#64748b'
    };

    const statusIcons = {
      pending: 'fa-clock',
      processing: 'fa-spinner fa-spin',
      completed: 'fa-check-circle',
      rejected: 'fa-times-circle',
      cancelled: 'fa-ban'
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
          <div class="transaction-type">
            <i class="fas ${typeInfo.icon}" style="color: ${typeInfo.color}"></i>
            <span>${typeInfo.text}</span>
          </div>
          <div class="transaction-status" style="color: ${statusColors[tx.status]}">
            <i class="fas ${statusIcons[tx.status]}"></i>
            <span>${tx.status}</span>
          </div>
        </div>
        <div class="transaction-body">
          <div class="transaction-info">
            <span class="transaction-method">${methodText[tx.method] || tx.method}</span>
            ${tx.bank_name ? `<span class="transaction-detail">• ${tx.bank_name}</span>` : ''}
            ${tx.crypto_type ? `<span class="transaction-detail">• ${tx.crypto_type.toUpperCase()}</span>` : ''}
          </div>
          <div class="transaction-amount" style="color: ${typeInfo.color}">
            ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount.toLocaleString('es-CL')}
          </div>
        </div>
        <div class="transaction-footer">
          <span class="transaction-date">${date}</span>
          <span class="transaction-fichas">${tx.fichas.toLocaleString('es-CL')} fichas</span>
        </div>
      </div>
    `;
  }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const filter = btn.dataset.filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Load filtered transactions
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
      console.error('Error filtering transactions:', err);
    }
  });
});

// Toast notification
function showToast(message, type = 'success') {
  const toastMessage = document.getElementById('toastMessage');
  const icon = toast.querySelector('i');
  
  toastMessage.textContent = message;
  
  // Remove previous classes
  toast.classList.remove('error', 'show');
  
  // Update icon and style
  if (type === 'error') {
    toast.classList.add('error');
    icon.className = 'fas fa-times-circle';
  } else if (type === 'warning') {
    toast.style.borderColor = '#f59e0b';
    icon.className = 'fas fa-exclamation-triangle';
    icon.style.color = '#f59e0b';
  } else {
    icon.className = 'fas fa-check-circle';
    icon.style.color = '#10b981';
  }
  
  // Show toast
  toast.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
