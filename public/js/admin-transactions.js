// admin-transactions.js - Funcionalidades de gestión de transacciones

// Ver detalles de transacción
async function viewTransaction(transactionId) {
  alert('Detalles de transacción #' + transactionId + '\n(Funcionalidad en desarrollo)');
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
