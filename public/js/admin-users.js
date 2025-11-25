// admin-users.js 
async function viewUser(userId) {
  const response = await adminFetch(`/admin/api/user/${userId}`);
  
  if (!response) {
    alert('Error al cargar datos del usuario');
    return;
  }
  
  const data = await response.json();
  
  if (data.ok) {
    const user = data.user;
    const transactions = data.transactions || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Detalles de Usuario #${user.userId}
          </h2>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="info-section">
            <h3>Información General</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>ID:</strong>
                <span>${user.userId}</span>
              </div>
              <div class="info-item">
                <strong>Nickname:</strong>
                <span>${user.nickname}</span>
              </div>
              <div class="info-item">
                <strong>Email:</strong>
                <span>${user.email}</span>
              </div>
              <div class="info-item">
                <strong>RUT:</strong>
                <span>${user.rut || 'N/A'}</span>
              </div>
              <div class="info-item">
                <strong>Balance:</strong>
                <span class="amount">$${user.balance.toLocaleString('es-CL')} CLP</span>
              </div>
              <div class="info-item">
                <strong>Bloqueado:</strong>
                <span>${user.locked || 0} fichas</span>
              </div>
              <div class="info-item">
                <strong>Rol:</strong>
                <span class="role-badge ${user.role}">${user.role}</span>
              </div>
              <div class="info-item">
                <strong>Registro:</strong>
                <span>${formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Transacciones Recientes</h3>
            ${transactions.length === 0 ? '<p class="empty-message">Sin transacciones</p>' : `
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
                  ${transactions.map(tx => `
                    <tr>
                      <td><span class="type-badge ${tx.type}">${tx.type}</span></td>
                      <td>$${tx.amount.toLocaleString('es-CL')}</td>
                      <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
                      <td>${formatDate(tx.createdAt)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
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
  } else {
    alert('Error: ' + data.message);
  }
}

function showCreateUserModal() {
  const currentUserData = JSON.parse(localStorage.getItem('nimetsuCasinoUser'));
  const currentUserRole = currentUserData?.role || 'user';
  const isSuperAdmin = currentUserRole === 'superadmin';
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Crear Nuevo Usuario
        </h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <form id="createUserForm" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="new-nickname">Nickname:</label>
              <input type="text" id="new-nickname" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="new-email">Email:</label>
              <input type="email" id="new-email" class="form-control" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="new-rut">RUT:</label>
              <input type="text" id="new-rut" class="form-control" placeholder="12.345.678-9">
            </div>
            <div class="form-group">
              <label for="new-password">Contraseña:</label>
              <input type="password" id="new-password" class="form-control" required minlength="6">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="new-balance">Balance Inicial (fichas):</label>
              <input type="number" id="new-balance" class="form-control" value="1000" min="0">
            </div>
            <div class="form-group">
              <label for="new-role">Rol:</label>
              <select id="new-role" class="form-control">
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                ${isSuperAdmin ? '<option value="superadmin">Super Administrador</option>' : ''}
              </select>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="createUser()">Crear Usuario</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

async function createUser() {
  const nickname = document.getElementById('new-nickname').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const rut = document.getElementById('new-rut').value.trim();
  const password = document.getElementById('new-password').value;
  const balance = parseInt(document.getElementById('new-balance').value) || 1000;
  const role = document.getElementById('new-role').value;
  
  if (!nickname || !email || !password) {
    alert('Por favor, completa todos los campos obligatorios');
    return;
  }
  
  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  const createBtn = document.querySelector('.modal-footer .btn-primary');
  if (createBtn) createBtn.disabled = true;

  try {
    const response = await adminFetch('/admin/api/user/create', {
      method: 'POST',
      body: JSON.stringify({ nickname, email, rut, password, balance, role })
    });

    if (!response) {
      if (!navigator.onLine) {
        alert('Sin conexión: verifica tu conexión a internet');
      } else {
        alert('No fue posible crear el usuario. Revisa tu sesión o inténtalo nuevamente.');
      }
      return;
    }

    const data = await response.json();

    if (data.ok) {
      alert('Usuario creado exitosamente');
      closeModal();
      refreshPage();
    } else {
      alert('Error: ' + (data.message || 'Error desconocido'));
    }
  } catch (err) {
    console.error('Error creando usuario:', err);
    alert('Ocurrió un error al crear el usuario. Revisa la consola para más detalles.');
  } finally {
    if (createBtn) createBtn.disabled = false;
  }
}

async function editUser(userId) {
  const response = await adminFetch(`/admin/api/user/${userId}`);
  
  if (!response) {
    alert('Error al cargar datos del usuario');
    return;
  }
  
  const data = await response.json();
  
  if (!data.ok) {
    alert('Error: ' + data.message);
    return;
  }
  
  const user = data.user;
  const currentUserData = JSON.parse(localStorage.getItem('nimetsuCasinoUser'));
  const currentUserRole = currentUserData?.role || 'user';
  
  const canEditRole = (currentUserRole === 'superadmin') || 
                      (currentUserRole === 'admin' && user.role !== 'superadmin');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Editar Usuario #${user.userId}
        </h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <form id="editUserForm" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label for="edit-nickname">Nickname:</label>
              <input type="text" id="edit-nickname" class="form-control" value="${user.nickname}" required>
            </div>
            <div class="form-group">
              <label for="edit-email">Email:</label>
              <input type="email" id="edit-email" class="form-control" value="${user.email}" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-rut">RUT:</label>
              <input type="text" id="edit-rut" class="form-control" value="${user.rut || ''}" placeholder="12.345.678-9">
            </div>
            <div class="form-group">
              <label for="edit-balance">Balance (fichas):</label>
              <input type="number" id="edit-balance" class="form-control" value="${user.balance || 0}" min="0">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="edit-locked">Bloqueado (fichas):</label>
              <input type="number" id="edit-locked" class="form-control" value="${user.locked || 0}" min="0">
            </div>
            <div class="form-group">
              <label for="edit-role">Rol:</label>
              <select id="edit-role" class="form-control" ${!canEditRole ? 'disabled' : ''}>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                ${currentUserRole === 'superadmin' ? `<option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>Super Administrador</option>` : ''}
              </select>
              ${!canEditRole ? '<small style="color: #f59e0b;">No tienes permisos para cambiar este rol</small>' : ''}
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group full-width">
              <label for="edit-password">Nueva Contraseña (dejar vacío para no cambiar):</label>
              <input type="password" id="edit-password" class="form-control" minlength="6">
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="updateUser(${userId})">Guardar Cambios</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

async function updateUser(userId) {
  const nickname = document.getElementById('edit-nickname').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const rut = document.getElementById('edit-rut').value.trim();
  const password = document.getElementById('edit-password').value;
  const balance = parseInt(document.getElementById('edit-balance').value) || 0;
  const locked = parseInt(document.getElementById('edit-locked').value) || 0;
  const role = document.getElementById('edit-role').value;
  
  if (!nickname || !email) {
    alert('Nickname y email son obligatorios');
    return;
  }
  
  if (password && password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  const updateData = {
    nickname,
    email,
    rut,
    balance,
    locked,
    role
  };
  
  if (password) {
    updateData.password = password;
  }
  
  const response = await adminFetch(`/admin/api/user/${userId}/update`, {
    method: 'POST',
    body: JSON.stringify(updateData)
  });
  
  if (!response) {
    alert('Error al actualizar usuario');
    return;
  }
  
  const data = await response.json();
  
  if (data.ok) {
    alert('Usuario actualizado exitosamente');
    closeModal();
    refreshPage();
  } else {
    alert('Error: ' + data.message);
  }
}

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
  
  if (response.status === 403) {
    alert('No tienes permisos para modificar el balance de este usuario');
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

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchUser');
  if (searchInput) {
    searchInput.addEventListener('input', searchUsers);
  }
});
