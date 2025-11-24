// admin-transactions.js - Funcionalidades de gestión de transacciones

// Ver detalles de transacción
async function viewTransaction(transactionId) {
  try {
    console.log('Solicitando transacción:', transactionId);
    
    const response = await adminFetch(`/admin/api/transaction/${transactionId}/history`);
    
    if (!response) {
      console.error('No se recibió respuesta del servidor');
      alert('Error al cargar detalles de la transacción');
      return;
    }
    
    console.log('Respuesta recibida, status:', response.status);
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    if (!data.ok) {
      console.error('Error en respuesta:', data.message);
      alert(data.message || 'Error al cargar detalles');
      return;
    }
    
    showTransactionModal(data.transaction, data.history);
  } catch (error) {
    console.error('Error capturado:', error);
    alert('Error al cargar detalles de la transacción: ' + error.message);
  }
}

// Mostrar modal con detalles y historial
function showTransactionModal(transaction, history) {
  const isPending = transaction.status === 'pending' || transaction.status === 'processing';
  const isDeposit = transaction.type === 'deposit';
  const isWithdraw = transaction.type === 'withdraw';
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          Detalles de Transacción #${transaction.transactionId}
        </h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Información Principal -->
        <div class="info-section">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Información General
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <strong>Usuario:</strong>
              <span id="tx-nickname">${transaction.nickname || 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>Email:</strong>
              <span id="tx-email">${transaction.email || 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>RUT:</strong>
              <span id="tx-rut">${transaction.rut || 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>Tipo:</strong>
              <span class="type-badge ${transaction.type}">${transaction.type === 'deposit' ? 'Depósito' : transaction.type === 'withdraw' ? 'Retiro' : 'Ajuste'}</span>
            </div>
            <div class="info-item">
              <strong>Monto Solicitado:</strong>
              <span class="amount">$${parseInt(transaction.amount).toLocaleString('es-CL')} CLP</span>
            </div>
            <div class="info-item">
              <strong>Fichas:</strong>
              <span class="fichas-value">${transaction.fichas ? parseInt(transaction.fichas).toLocaleString('es-CL') + ' fichas' : 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>Método de Pago:</strong>
              <span id="tx-method" class="method-badge">${formatPaymentMethod(transaction.method)}</span>
            </div>
            <div class="info-item">
              <strong>Estado Actual:</strong>
              <span class="status-badge ${transaction.status}">${transaction.status}</span>
            </div>
            <div class="info-item">
              <strong>Fecha Creación:</strong>
              <span>${new Date(transaction.createdAt).toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        ${isDeposit && transaction.method === 'bank_transfer' ? `
          <div class="info-section payment-info-section">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Información del Depósito
            </h3>
            <div class="payment-instructions">
              <p><strong>Instrucciones:</strong> El usuario realizó una transferencia bancaria. Verifica los datos en tu cuenta antes de aprobar.</p>
              ${transaction.external_reference ? `<p><strong>Referencia:</strong> <code>${transaction.external_reference}</code></p>` : ''}
            </div>
          </div>
        ` : ''}

        ${transaction.notes ? `
          <div class="info-section">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Notas Adicionales
            </h3>
            <div class="notes-box">
              <p id="tx-notes">${transaction.notes || 'Sin notas'}</p>
            </div>
          </div>
        ` : ''}

        ${isWithdraw ? `
          <div class="info-section bank-section">
            <div class="bank-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Datos Bancarios para Transferencia
              </h3>
              <button class="btn-copy-bank" onclick="copyBankData(${transaction.transactionId})" title="Copiar datos para transferencia">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copiar Datos
              </button>
            </div>
            <div class="bank-info-card">
              <div class="bank-data-line">
                <span class="data-label">Nombre del Titular:</span>
                <span class="data-value">${transaction.nickname || 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line">
                <span class="data-label">RUT:</span>
                <span class="data-value">${transaction.account_rut || 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line">
                <span class="data-label">Banco:</span>
                <span class="data-value">${transaction.bank_name ? transaction.bank_name.charAt(0).toUpperCase() + transaction.bank_name.slice(1).toLowerCase() : 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line">
                <span class="data-label">Tipo de Cuenta:</span>
                <span class="data-value">${transaction.account_type ? (transaction.account_type === 'corriente' ? 'Cuenta Corriente' : transaction.account_type === 'vista' ? 'Cuenta Vista' : 'Cuenta de Ahorro') : 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line">
                <span class="data-label">Número de Cuenta:</span>
                <span class="data-value account-number">${transaction.account_number || 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line">
                <span class="data-label">Email:</span>
                <span class="data-value">${transaction.email || 'NO ESPECIFICADO'}</span>
              </div>
              <div class="bank-data-line transfer-line">
                <span class="data-label">Monto a Transferir:</span>
                <span class="data-value transfer-amount">$${parseInt(transaction.amount).toLocaleString('es-CL')} CLP</span>
              </div>
            </div>
            <div class="bank-data-container" id="bank-data-${transaction.transactionId}" style="display:none;">
${transaction.nickname || 'NO ESPECIFICADO'}
${transaction.account_rut || 'NO ESPECIFICADO'}
${transaction.bank_name ? transaction.bank_name.charAt(0).toUpperCase() + transaction.bank_name.slice(1).toLowerCase() : 'NO ESPECIFICADO'}
${transaction.account_type ? (transaction.account_type === 'corriente' ? 'Cuenta Corriente' : transaction.account_type === 'vista' ? 'Cuenta Vista' : 'Cuenta de Ahorro') : 'NO ESPECIFICADO'}
${transaction.account_number || 'NO ESPECIFICADO'}
${transaction.email || 'NO ESPECIFICADO'}
            </div>
          </div>
        ` : ''}
        
        ${isPending ? `
          <!-- Formulario de Aprobación/Rechazo -->
          <div class="info-section approval-section">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Procesar Solicitud de ${isDeposit ? 'Depósito' : 'Retiro'}
            </h3>
            <div class="approval-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="confirmed-amount">
                    <strong>${isDeposit ? 'Monto Transferido por el Usuario (CLP):' : 'Monto a Transferir (CLP):'}</strong>
                    <small>${isDeposit ? 'Confirma el monto exacto en pesos chilenos que el usuario transfirió' : 'Ingresa el monto exacto en pesos chilenos que vas a transferir'}</small>
                  </label>
                  <div class="input-with-currency">
                    <span class="currency-symbol">$</span>
                    <input 
                      type="number" 
                      id="confirmed-amount" 
                      class="form-control with-currency" 
                      placeholder="${parseInt(transaction.amount).toLocaleString('es-CL')}"
                      step="1"
                      min="0"
                      value="${parseInt(transaction.amount)}"
                    >
                    <span class="currency-code">CLP</span>
                  </div>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="approval-reason">
                    <strong>Observaciones:</strong>
                    <small>Detalla cualquier información relevante sobre la transacción</small>
                  </label>
                  <textarea 
                    id="approval-reason" 
                    class="form-control" 
                    rows="3"
                    placeholder="${isDeposit ? 'Ej: Transferencia confirmada desde cuenta terminada en 1234' : 'Ej: Transferencia realizada a cuenta banco Chile cuenta corriente'}"
                  ></textarea>
                </div>
              </div>

              <div class="approval-actions">
                <button class="btn-approve" onclick="approveTransaction(${transaction.transactionId})">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Aprobar ${isDeposit ? 'Depósito' : 'Retiro'}
                </button>
                <button class="btn-reject" onclick="rejectTransaction(${transaction.transactionId})">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Rechazar Solicitud
                </button>
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- Historial de Cambios -->
        <div class="history-section">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            Historial de Cambios de Estado
          </h3>
          ${history.length === 0 ? '<p class="empty-message">No hay cambios de estado registrados</p>' : `
            <div class="history-timeline">
              ${history.map(h => `
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="status-change">
                        ${h.old_status ? `<span class="status-badge ${h.old_status}">${h.old_status}</span>` : '<span class="status-badge new">NUEVO</span>'}
                        <span class="arrow">→</span>
                        <span class="status-badge ${h.new_status}">${h.new_status}</span>
                      </span>
                      <span class="timeline-date">${new Date(h.status_changed_at).toLocaleString('es-CL')}</span>
                    </div>
                    ${h.reason ? `<p class="timeline-reason"><strong>Razón:</strong> ${h.reason}</p>` : ''}
                    ${h.changed_by_name ? `<p class="timeline-admin"><strong>Por:</strong> ${h.changed_by_name}</p>` : '<p class="timeline-admin"><strong>Por:</strong> Sistema</p>'}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// Aprobar transacción
async function approveTransaction(transactionId) {
  const confirmedAmount = document.getElementById('confirmed-amount')?.value;
  const reason = document.getElementById('approval-reason')?.value;

  if (!confirmedAmount || parseFloat(confirmedAmount) <= 0) {
    alert('Por favor, ingresa el monto confirmado de la transferencia');
    return;
  }

  if (!reason || reason.trim() === '') {
    if (!confirm('No has ingresado observaciones. ¿Deseas continuar sin observaciones?')) {
      return;
    }
  }

  const confirmMsg = `¿Confirmar aprobación de esta transacción?\n\nMonto: $${parseInt(confirmedAmount).toLocaleString('es-CL')} CLP`;
  
  if (!confirm(confirmMsg)) return;

  const fullReason = `Monto confirmado: $${parseInt(confirmedAmount).toLocaleString('es-CL')} CLP. ${reason ? 'Observaciones: ' + reason : 'Sin observaciones adicionales.'}`;

  const response = await adminFetch(`/admin/api/transaction/${transactionId}/status`, {
    method: 'POST',
    body: JSON.stringify({ 
      status: 'completed',
      reason: fullReason,
      confirmedAmount: parseFloat(confirmedAmount)
    })
  });

  if (!response) {
    alert('Error al aprobar transacción');
    return;
  }

  const data = await response.json();

  if (data.success) {
    alert('Transacción aprobada exitosamente');
    closeModal();
    refreshPage();
  } else {
    alert('Error: ' + (data.message || 'No se pudo aprobar la transacción'));
  }
}

// Rechazar transacción
async function rejectTransaction(transactionId) {
  const reason = document.getElementById('approval-reason')?.value;

  if (!reason || reason.trim() === '') {
    alert('Por favor, ingresa la razón del rechazo');
    return;
  }

  const confirmMsg = '¿Estás seguro de rechazar esta transacción?\n\nEsta acción NO se puede deshacer.';
  
  if (!confirm(confirmMsg)) return;

  const response = await adminFetch(`/admin/api/transaction/${transactionId}/status`, {
    method: 'POST',
    body: JSON.stringify({ 
      status: 'rejected',
      reason: 'Rechazado. Motivo: ' + reason
    })
  });

  if (!response) {
    alert('Error al rechazar transacción');
    return;
  }

  const data = await response.json();

  if (data.success) {
    alert('Transacción rechazada');
    closeModal();
    refreshPage();
  } else {
    alert('Error: ' + (data.message || 'No se pudo rechazar la transacción'));
  }
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Formatear método de pago
function formatPaymentMethod(method) {
  const methods = {
    'bank_transfer': 'Transferencia Bancaria',
    'mercadopago': 'MercadoPago',
    'crypto_btc': 'Bitcoin (BTC)',
    'crypto_usdt': 'Tether (USDT)',
    'crypto': 'Criptomoneda',
    'cash': 'Efectivo'
  };
  return methods[method] || method || 'No especificado';
}

// Copiar datos bancarios
function copyBankData(transactionId) {
  const bankDataElement = document.getElementById(`bank-data-${transactionId}`);
  if (!bankDataElement) {
    alert('No se encontraron datos bancarios');
    return;
  }
  
  const bankData = bankDataElement.textContent.trim();
  
  // Crear elemento temporal para copiar
  const textarea = document.createElement('textarea');
  textarea.value = bankData;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    
    // Cambiar texto del botón temporalmente
    const btn = event.target.closest('.btn-copy-bank');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      ¡Copiado!
    `;
    btn.style.background = 'rgba(16, 185, 129, 0.3)';
    btn.style.borderColor = '#10b981';
    btn.style.color = '#10b981';
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  } catch (err) {
    console.error('Error al copiar:', err);
    alert('Error al copiar los datos');
  } finally {
    document.body.removeChild(textarea);
  }
}

// Actualizar estado de transacción
async function updateStatus(transactionId, newStatus) {
  const confirmMsg = newStatus === 'completed' 
    ? '¿Aprobar esta transacción?' 
    : '¿Rechazar esta transacción?';
  
  if (!confirm(confirmMsg)) return;
  
  const reason = prompt('Razón del cambio de estado:');
  
  if (!reason) {
    alert('Debes proporcionar una razón');
    return;
  }
  
  const response = await adminFetch(`/admin/api/transaction/${transactionId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: newStatus, reason })
  });
  
  if (!response) {
    alert('Error al actualizar transacción');
    return;
  }
  
  const data = await response.json();
  
  if (data.success) {
    alert(`Transacción actualizada a: ${newStatus}`);
    refreshPage();
  } else {
    alert('Error: ' + data.message);
  }
}
