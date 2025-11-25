// admin-common.js
(function() {
  const token = localStorage.getItem('nimetsuCasinoToken') || localStorage.getItem('token');
  
  if (!token) {
    window.location.replace('/login');
    throw new Error('No authenticated - redirecting');
  }
})();

async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('nimetsuCasinoToken') || localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found, redirecting to login');
    window.location.replace('/login');
    return null;
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
    
    if (response.status === 401) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
    
    if (response.status === 403) {
      alert('No tienes permisos para realizar esta acción.');
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('Error en petición:', error);
    return null;
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function adminLogout() {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    localStorage.clear();
    window.location.href = '/login';
  }
}

function refreshPage() {
  window.location.reload();
}
