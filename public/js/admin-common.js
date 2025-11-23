// admin-common.js - Funciones comunes para panel de administración

// NOTA: La verificación de autenticación se hace en el SERVIDOR (middleware mustBeAdminPage)
// No se hace verificación en el cliente por seguridad

// Hacer peticiones autenticadas
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('nimetsuCasinoToken') || localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (response.status === 401 || response.status === 403) {
      alert('Sesión expirada o sin permisos');
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Error en petición:', error);
    return null;
  }
}

// Formatear números como dinero
function formatMoney(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
}

// Formatear fechas
function formatDate(dateString) {
  return new Date(dateString).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Cerrar sesión
function adminLogout() {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    localStorage.clear();
    window.location.href = '/login';
  }
}

// Recargar página
function refreshPage() {
  window.location.reload();
}
