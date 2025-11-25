'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const balanceService = require('../services/balanceService');

function createToken(user) {
  return jwt.sign(
    {
      userId  : user.userId,
      nickname: user.nickname,
      email   : user.email,
      role    : user.role || 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function renderLoginPage(req, res) {
  try {
    return res.render('login', {
      title: 'Nimetsu Casino - Login & Registro',
    });
  } catch (err) {
    return res.status(500).send('Error al cargar la página de login');
  }
}

async function register(req, res) {
  try {
    const { nickname, email, rut, password } = req.body;

    if (!nickname || !email || !rut || !password) {
      return res.status(400).json({
        ok     : false,
        message: 'Faltan datos: nickname, email, rut o password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok     : false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const [rowsEmail] = await pool.query(
      'SELECT userId FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (rowsEmail.length > 0) {
      return res.status(409).json({
        ok     : false,
        message: 'El correo ya está registrado',
      });
    }

    const [rowsRut] = await pool.query(
      'SELECT userId FROM users WHERE rut = ? LIMIT 1',
      [rut]
    );
    if (rowsRut.length > 0) {
      return res.status(409).json({
        ok     : false,
        message: 'El RUT ya está registrado',
      });
    }

    const passHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (nickname, email, passHash, rut) VALUES (?, ?, ?, ?)',
      [nickname, email, passHash, rut]
    );

    const userId = result.insertId;

    await balanceService.createBalance(userId, 1000);

    const user = {
      userId,
      nickname,
      email,
      role: 'user',
    };

    const token = createToken(user);

    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    
    res.cookie('nimetsuCasinoToken', token, {
      httpOnly: true,
      secure: isSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      sameSite: isSecure ? 'none' : 'lax', 
      path: '/',
      domain: req.hostname === 'localhost' ? undefined : '.nimetsu.com' 
    });

    return res.status(201).json({
      ok     : true,
      message: 'Usuario registrado correctamente',
      token,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      ok     : false,
      message: 'Error interno al registrar',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok     : false,
        message: 'Falta email o password',
      });
    }

    const [rows] = await pool.query(
      'SELECT userId, nickname, email, passHash, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok     : false,
        message: 'Credenciales inválidas',
      });
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(password, user.passHash);
    if (!passwordOk) {
      return res.status(401).json({
        ok     : false,
        message: 'Credenciales inválidas',
      });
    }

    const token = createToken(user);

    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    
    res.cookie('nimetsuCasinoToken', token, {
      httpOnly: true,
      secure: isSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isSecure ? 'none' : 'lax',
      path: '/',
      domain: req.hostname === 'localhost' ? undefined : '.nimetsu.com'
    });

    const redirect = (user.role === 'admin' || user.role === 'superadmin')
      ? '/admin/sel-panel'
      : '/dashboard';

    return res.json({
      ok     : true,
      message: 'Login correcto',
      token,
      redirect,
      user: {
        userId  : user.userId,
        nickname: user.nickname,
        email   : user.email,
        role    : user.role || 'user',
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok     : false,
      message: 'Error interno en el servidor',
    });
  }
}

async function renderAdminSelector(req, res) {
  try {
    return res.render('admin/selector', {
      title: 'Seleccionar Panel - Nimetsu Casino',
    });
  } catch (err) {
    return res.redirect('/login');
  }
}

function logout(req, res) {
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  
  res.clearCookie('nimetsuCasinoToken', {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
    domain: req.hostname === 'localhost' ? undefined : '.nimetsu.com'
  });

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.json({ ok: true, message: 'Sesión cerrada correctamente' });
  }

  res.redirect('/login');
}

module.exports = {
  renderLoginPage,
  register,
  login,
  renderAdminSelector,
  logout,
};
