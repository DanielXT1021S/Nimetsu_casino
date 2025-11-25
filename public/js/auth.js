
const tabs = document.querySelectorAll('.tab');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerMsg = document.getElementById('registerMsg');
const passwordToggles = document.querySelectorAll('.password-toggle');
const forgotPasswordLink = document.getElementById('forgotPassword');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (targetTab === 'login') {
        loginSection.classList.add('active');
        registerSection.classList.remove('active');
    } else {
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
    }
    });
});

passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = toggle.getAttribute('data-target');
    const passwordInput = document.getElementById(targetId);
    const icon = toggle.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
    });
});

const inputs = document.querySelectorAll('input[required]');
inputs.forEach(input => {
    input.addEventListener('input', () => {
    const icon = input.parentNode.querySelector('.validation-icon');
    
    if (input.value.trim() === '') {
        input.classList.remove('valid', 'invalid');
        if (icon) icon.classList.remove('valid', 'invalid');
    } else if (input.checkValidity()) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        if (icon) {
        icon.classList.add('valid');
        icon.classList.remove('invalid');
        }
    } else {
        input.classList.add('invalid');
        input.classList.remove('valid');
        if (icon) {
        icon.classList.add('invalid');
        icon.classList.remove('valid');
        }
    }
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginError.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
    showError(loginError, 'Por favor, completa todos los campos');
    return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();


    if (!res.ok || !data.ok) {
        showError(loginError, data.message || 'Credenciales inválidas');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }

    localStorage.setItem('nimetsuCasinoToken', data.token);
    localStorage.setItem('nimetsuCasinoUser', JSON.stringify(data.user));

    showSuccess(loginError, 'Inicio de sesión exitoso. Redirigiendo...');
    
    setTimeout(() => {
        window.location.href = data.redirect || '/dashboard';
    }, 1500);
    } catch (err) {
    showError(loginError, 'Error de conexión con el servidor');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerMsg.style.display = 'none';
    registerMsg.textContent = '';

    const nickname = document.getElementById('regNickname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const rut = document.getElementById('regRut').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!nickname || !email || !rut || !password) {
    showError(registerMsg, 'Por favor, completa todos los campos');
    return;
    }

    if (password.length < 6) {
    showError(registerMsg, 'La contraseña debe tener al menos 6 caracteres');
    return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';

    try {
    const res = await fetch('/auth/register', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, email, rut, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
        showError(registerMsg, data.message || 'Error al registrar usuario');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }

    localStorage.setItem('nimetsuCasinoToken', data.token);
    localStorage.setItem('nimetsuCasinoUser', JSON.stringify(data.user));

    showSuccess(registerMsg, 'Cuenta creada exitosamente. Redirigiendo...');

    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 1500);
    } catch (err) {
    showError(registerMsg, 'Error de conexión con el servidor');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    }
});

function showError(element, message) {
    element.textContent = message;
    element.className = 'error-msg';
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'info-msg';
    element.style.display = 'block';
}

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Funcionalidad de recuperación de contraseña en desarrollo');
});
