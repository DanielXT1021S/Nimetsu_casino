async function viewUser(userId) {
  const response = await adminFetch(`/admin/api/user/${userId}`);
  
  if (!response) {
    alert('Error al cargar datos del usuario');
    return;
  }
  
  const data = await response.json();
  
  if (data.success) {
    const user = data.user;
    const transactions = data.transactions || [];
    
    let html = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Detalles de Usuario
          </h2>
          <div class="user-details">
            <p><strong>ID:</strong> ${user.userId}</p>
            <p><strong>Nickname:</strong> ${user.nickname}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>RUT:</strong> ${user.rut || 'N/A'}</p>
            <p><strong>Balance:</strong> $${user.balance.toLocaleString('es-CL')}</p>
            <p><strong>Rol:</strong> ${user.role}</p>
            <p><strong>Registro:</strong> ${formatDate(user.createdAt)}</p>
          </div>
          
          <h3>Transacciones Recientes</h3>
          <table class="modal-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.length === 0 ? 
                '<tr><td colspan="4">Sin transacciones</td></tr>' :
                transactions.map(tx => `
                  <tr>
                    <td>${tx.type}</td>
                    <td>$${tx.amount.toLocaleString('es-CL')}</td>
                    <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
                    <td>${formatDate(tx.createdAt)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
          
          <button class="btn-close" onclick="closeModal()">Cerrar</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
  } else {
    alert('Error: ' + data.message);
  }
}

// Ajustar balance de usuario
async function adjustBalance(userId) {
  const amount = prompt('Ingresa el monto a ajustar (usa - para restar):');
  
  if (amount === null) return;
  
  const amountNum = parseFloat(amount);
  
  if (isNaN(amountNum)) {
    alert('Monto inválido');
    return;
  }
  
  const reason = prompt('Razón del ajuste:');
  
  if (!reason) {
    alert('Debes proporcionar una razón');
    return;
  }
  
  const response = await adminFetch(`/admin/api/user/${userId}/balance`, {
    method: 'POST',
    body: JSON.stringify({ amount: amountNum, reason })
  });
  
  if (!response) {
    alert('Error al ajustar balance');
    return;
  }
  
  const data = await response.json();
  
  if (data.success) {
    alert(`Balance ajustado exitosamente. Nuevo balance: $${data.newBalance.toLocaleString('es-CL')}`);
    refreshPage();
  } else {
    alert('Error: ' + data.message);
  }
}

// Cerrar modal
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Buscar usuarios
function searchUsers() {
  const input = document.getElementById('searchUser');
  const filter = input.value.toLowerCase();
  const table = document.querySelector('.data-table tbody');
  const rows = table.getElementsByTagName('tr');
  
  for (let row of rows) {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  }
}

// Event listener para búsqueda
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchUser');
  if (searchInput) {
    searchInput.addEventListener('input', searchUsers);
  }
});
